"""Loads and cross-references the pack's own files for the tests. Standard library only.

Nothing here talks to the game. It reads the JSON under data/ and texturepack/, the mc-build sources under src/, and
the generated functions when a build exists. The SNBT reader covers what the pack writes: compounds, lists, quoted
and bare strings, and the numeric suffixes b, s, l, f and d.
"""
import json
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
NS = "foxcraft_dungeon_loot"
DATA = ROOT / "data" / NS
MC_DATA = ROOT / "data" / "minecraft"
SRC = ROOT / "src"
SRC_NS = SRC / NS
SRC_ITEMS = SRC_NS / "item"
GEN_FUNCTIONS = DATA / "function"
TP = ROOT / "texturepack" / "assets" / NS
TP_MC = ROOT / "texturepack" / "assets" / "minecraft"

# Audio that is gitignored and copied in by hand. A missing file here is a warning, not a failure.
GITIGNORED_AUDIO = ("records/wolfgun/", "records/c418/")


def load_json(path):
    with open(path, encoding="utf-8") as handle:
        return json.load(handle)


def read_text(path):
    with open(path, encoding="utf-8", newline="") as handle:
        return handle.read()


def rel(path):
    return str(Path(path).relative_to(ROOT)).replace("\\", "/")


# region SNBT

class SnbtError(ValueError):
    pass


class _Snbt:
    BARE_END = ",}] \t\r\n"

    def __init__(self, text):
        self.s = text
        self.i = 0

    def ws(self):
        while self.i < len(self.s) and self.s[self.i].isspace():
            self.i += 1

    def peek(self):
        self.ws()
        if self.i >= len(self.s):
            raise SnbtError("unexpected end in " + self.s)
        return self.s[self.i]

    def expect(self, ch):
        if self.peek() != ch:
            raise SnbtError("expected %r at %d in %s" % (ch, self.i, self.s))
        self.i += 1

    def parse(self):
        value = self.value()
        self.ws()
        if self.i != len(self.s):
            raise SnbtError("trailing text at %d in %s" % (self.i, self.s))
        return value

    def value(self):
        c = self.peek()
        if c == "{":
            return self.compound()
        if c == "[":
            return self.list()
        if c in "\"'":
            return self.string()
        return self.scalar()

    def compound(self):
        self.expect("{")
        out = {}
        if self.peek() == "}":
            self.i += 1
            return out
        while True:
            key = self.string() if self.peek() in "\"'" else self.bare()
            self.expect(":")
            out[key] = self.value()
            c = self.peek()
            self.i += 1
            if c == "}":
                return out
            if c != ",":
                raise SnbtError("expected , or } at %d in %s" % (self.i, self.s))

    def list(self):
        self.expect("[")
        out = []
        if self.peek() == "]":
            self.i += 1
            return out
        while True:
            out.append(self.value())
            c = self.peek()
            self.i += 1
            if c == "]":
                return out
            if c != ",":
                raise SnbtError("expected , or ] at %d in %s" % (self.i, self.s))

    def string(self):
        quote = self.s[self.i]
        self.i += 1
        out = []
        while True:
            if self.i >= len(self.s):
                raise SnbtError("unterminated string in " + self.s)
            c = self.s[self.i]
            self.i += 1
            if c == "\\":
                out.append(self.s[self.i])
                self.i += 1
            elif c == quote:
                return "".join(out)
            else:
                out.append(c)

    def bare(self):
        self.ws()
        start = self.i
        while self.i < len(self.s) and self.s[self.i] not in self.BARE_END + ":":
            self.i += 1
        if start == self.i:
            raise SnbtError("empty key at %d in %s" % (self.i, self.s))
        return self.s[start:self.i]

    def scalar(self):
        self.ws()
        start = self.i
        while self.i < len(self.s) and self.s[self.i] not in self.BARE_END:
            self.i += 1
        token = self.s[start:self.i]
        if token in ("true", "false"):
            return ("byte", 1 if token == "true" else 0)
        m = re.fullmatch(r"([-+]?\d+)([bBsSlL]?)", token)
        if m:
            kind = {"": "int", "b": "byte", "s": "short", "l": "long"}[m.group(2).lower()]
            return (kind, int(m.group(1)))
        m = re.fullmatch(r"([-+]?(?:\d+\.?\d*|\.\d+)(?:[eE][-+]?\d+)?)([fFdD]?)", token)
        if m:
            return ("float" if m.group(2).lower() == "f" else "double", float(m.group(1)))
        return token


def parse_snbt(text):
    return _Snbt(text).parse()


def snbt_matches(pattern, actual):
    """Partial match with vanilla's rules: compound keys must be present, list elements need any match, numbers
    must have the same type, so a byte never matches an int."""
    if isinstance(pattern, dict):
        return isinstance(actual, dict) and all(k in actual and snbt_matches(v, actual[k]) for k, v in pattern.items())
    if isinstance(pattern, list):
        return isinstance(actual, list) and all(any(snbt_matches(p, a) for a in actual) for p in pattern)
    return pattern == actual

# endregion


# region Modifiers and loot tables

def modifier_path(modifier_id):
    ns, _, path = modifier_id.partition(":")
    if ns != NS:
        return None
    return DATA / "item_modifier" / (path + ".json")


def loot_table_path(table_id):
    ns, _, path = table_id.partition(":")
    if ns != NS:
        return None
    return DATA / "loot_table" / (path + ".json")


def _as_list(value):
    if value is None:
        return []
    return value if isinstance(value, list) else [value]


def function_list(modifier_json):
    """A modifier file is one function, a list of functions, or a list that nests lists."""
    out = []
    for item in _as_list(modifier_json):
        if isinstance(item, list):
            out.extend(function_list(item))
        else:
            out.append(item)
    return out


def bare_type(fn):
    return fn.get("type", "").replace("minecraft:", "")


class Item:
    """The facts a loot table and its modifiers declare about one item. Function conditions are ignored, so a
    variant item shows the union of what its tiers set."""

    def __init__(self, name):
        self.name = name
        self.errors = []
        self.table_ids = []
        self.modifier_ids = []
        self.base_items = set()
        self.custom_data = {}
        self.custom_data_all = []
        self.item_models = set()
        self.components = {}
        self.has_name = False
        self.has_lore = False
        self.function_types = []

    @property
    def loot_ids(self):
        ids = set()
        for tag in self.custom_data_all:
            value = tag.get("DungeonLootId")
            if isinstance(value, tuple):
                ids.add(value[1])
        return ids


def _walk_entries(node, item, seen):
    """Collect base items, referenced loot tables and modifier ids from a loot table or pool structure."""
    if isinstance(node, list):
        for child in node:
            _walk_entries(child, item, seen)
        return
    if not isinstance(node, dict):
        return
    modifier = node.get("modifier")
    for mid in _as_list(modifier):
        if isinstance(mid, str):
            item.modifier_ids.append(mid)
        else:
            # Inline modifier on a pool or entry, used by the variant items to set a per-tier item_model.
            for fn in function_list(mid):
                _apply_function(item, fn, "inline modifier in " + item.name)
    kind = node.get("type", "").replace("minecraft:", "")
    if kind == "item" and "name" in node:
        item.base_items.add(node["name"])
    if kind == "loot_table" and isinstance(node.get("value"), str):
        table_id = node["value"]
        path = loot_table_path(table_id)
        if path is not None and table_id not in seen:
            seen.add(table_id)
            item.table_ids.append(table_id)
            if path.exists():
                _walk_entries(load_json(path), item, seen)
            else:
                item.errors.append("missing loot table %s" % table_id)
    for key in ("pools", "entries", "children"):
        if key in node:
            _walk_entries(node[key], item, seen)


def _apply_function(item, fn, origin):
    kind = bare_type(fn)
    item.function_types.append(kind)
    if kind == "set_name":
        item.has_name = True
    elif kind == "set_lore":
        item.has_lore = True
    elif kind == "set_custom_data":
        tag = fn.get("tag")
        if not isinstance(tag, str):
            item.errors.append("set_custom_data tag in %s is not an SNBT string" % origin)
            return
        try:
            parsed = parse_snbt(tag)
        except SnbtError as exc:
            item.errors.append("bad SNBT in %s: %s" % (origin, exc))
            return
        item.custom_data.update(parsed)
        item.custom_data_all.append(parsed)
    elif kind == "set_components":
        for key, value in fn.get("components", {}).items():
            item.components[key] = value
            if key == "minecraft:item_model":
                item.item_models.add(value)


def _apply_modifier(item, modifier_id):
    path = modifier_path(modifier_id)
    if path is None:
        return
    if not path.exists():
        item.errors.append("missing item modifier %s" % modifier_id)
        return
    for fn in function_list(load_json(path)):
        _apply_function(item, fn, modifier_id)


def build_item(name, table_path):
    """name is the path under loot_table/, such as item/mythic/chainsaw."""
    item = Item(name)
    table = load_json(table_path)
    item.table_ids.append("%s:%s" % (NS, name))
    _walk_entries(table, item, {"%s:%s" % (NS, name)})
    for mid in dict.fromkeys(item.modifier_ids):
        _apply_modifier(item, mid)
    return item


def predicate_dir(item_name):
    """predicate/item/<rarity>/<item>/ for an item named item/<rarity>/<item>, or None for discs and horns."""
    parts = item_name.split("/")
    if len(parts) == 3 and parts[1] in ("common", "uncommon", "rare", "epic", "mythic"):
        return DATA / "predicate" / "item" / parts[1] / parts[2]
    return None


def item_tables():
    """Every item the pack hands out as a unit: loot_table/item/** except random_loot, which holds pickers and pools.
    Discs and copper horn variants are under item/special/."""
    out = {}
    base = DATA / "loot_table" / "item"
    for path in sorted(base.rglob("*.json")):
        rel_path = path.relative_to(base).as_posix()[:-5]
        if not rel_path.startswith("random_loot/"):
            out["item/" + rel_path] = path
    return out

# endregion


# region Resource pack

def read_sounds():
    path = TP / "sounds.json"
    return load_json(path) if path.exists() else {}


def sound_files(sounds):
    """Yield (event, sound name) for every entry that points into this pack's namespace."""
    for event, body in sounds.items():
        for entry in body.get("sounds", []):
            name = entry if isinstance(entry, str) else entry.get("name", "")
            if name.startswith(NS + ":"):
                yield event, name[len(NS) + 1:]


def item_definition_path(item_model):
    ns, _, path = item_model.partition(":")
    if ns != NS:
        return None
    return TP / "items" / (path + ".json")


def model_texture_ids(model_json):
    return [v for v in model_json.get("textures", {}).values() if isinstance(v, str) and not v.startswith("#")]


def definition_models(node):
    """Collect every model id named inside an item definition tree."""
    out = []
    if isinstance(node, dict):
        if node.get("type", "").replace("minecraft:", "") == "model" and "model" in node:
            out.append(node["model"])
        for value in node.values():
            out.extend(definition_models(value))
    elif isinstance(node, list):
        for value in node:
            out.extend(definition_models(value))
    return out


def resource_problems(item_model):
    """Return a list of strings describing what is missing between an item_model id and its texture."""
    problems = []
    path = item_definition_path(item_model)
    if path is None:
        return problems  # vanilla model
    if not path.exists():
        return ["no item definition %s" % rel(path)]
    try:
        definition = load_json(path)
    except ValueError as exc:
        return ["item definition %s is not valid JSON: %s" % (rel(path), exc)]
    models = definition_models(definition)
    if not models:
        problems.append("item definition %s names no model" % rel(path))
    for model_id in models:
        ns, _, mpath = model_id.partition(":")
        if ns != NS:
            continue
        model_file = TP / "models" / (mpath + ".json")
        if not model_file.exists():
            problems.append("missing model %s" % rel(model_file))
            continue
        for tex in model_texture_ids(load_json(model_file)):
            tns, _, tpath = tex.partition(":")
            if tns != NS:
                continue
            if not (TP / "textures" / (tpath + ".png")).exists():
                problems.append("missing texture %s" % rel(TP / "textures" / (tpath + ".png")))
    return problems

# endregion


# region Source

def top_level_functions(text):
    """Names declared as `function name` at column 0, which are the hooks other files can call."""
    return re.findall(r"^function ([a-z0-9_]+)", text, flags=re.M)


def all_function_names(text):
    return re.findall(r"^\s*function ([a-z0-9_]+)", text, flags=re.M)


def function_tags():
    out = {}
    folder = DATA / "tags" / "function"
    for path in sorted(folder.glob("*.json")):
        values = load_json(path).get("values", [])
        out[path.stem] = [v if isinstance(v, str) else v.get("id", "") for v in values]
    return out


def src_item_files():
    return sorted(SRC_ITEMS.rglob("*.mcb"))


def src_item_for(name):
    """Source file for an item loot table name like item/mythic/chainsaw. The src tree mirrors loot_table/item."""
    return SRC_NS / (name + ".mcb")


def src_function_prefix(path):
    """Function id path of a source file, like item/mythic/chainsaw."""
    return path.relative_to(SRC_NS).with_suffix("").as_posix()


def strip_comments(text):
    return "\n".join(line for line in text.splitlines() if not line.lstrip().startswith("#"))


def generated_function(path_in_ns):
    return GEN_FUNCTIONS / (path_in_ns + ".mcfunction")


def build_exists():
    return GEN_FUNCTIONS.is_dir() and any(GEN_FUNCTIONS.rglob("*.mcfunction"))

# endregion
