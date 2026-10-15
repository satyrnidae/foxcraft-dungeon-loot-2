"""Regenerate tests/unit/specs/items.json from the pack as it is now.

The spec is a snapshot: one entry per item with the facts the tests pin down, such as its DungeonLootId, base items,
item models, source hooks and predicates. Run it after a deliberate change, then review the diff like any other code
change. A diff you did not expect is a bug the tests just caught.

    python tests/unit/gen_specs.py
"""
import json
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
import packdata as pk  # noqa: E402

SPEC_PATH = Path(__file__).resolve().parent / "specs" / "items.json"


def basename(name):
    return name.rsplit("/", 1)[-1]


def spec_for(name, path):
    item = pk.build_item(name, path)
    base = basename(name)
    src = pk.SRC_ITEMS / (base + ".mcb")
    pred_dir = pk.predicate_dir(name)
    rarity = item.custom_data.get("Rarity")
    dungeon_item = item.custom_data.get("DungeonItem") == ("byte", 1)
    return {
        "loot_ids": sorted(item.loot_ids),
        "dungeon_item": dungeon_item,
        "rarity": rarity if isinstance(rarity, str) else None,
        "base_items": sorted(item.base_items),
        "named": item.has_name,
        "function_types": sorted(set(item.function_types)),
        "item_models": sorted(item.item_models),
        "src": base if src.exists() else None,
        "hooks": sorted(pk.top_level_functions(pk.read_text(src))) if src.exists() else [],
        "predicates": sorted(p.stem for p in pred_dir.glob("*.json")) if pred_dir and pred_dir.is_dir() else [],
    }


def main():
    specs = {name: spec_for(name, path) for name, path in pk.item_tables().items()}
    SPEC_PATH.parent.mkdir(parents=True, exist_ok=True)
    text = json.dumps(specs, indent=2, sort_keys=True) + "\n"
    with open(SPEC_PATH, "w", encoding="utf-8", newline="") as handle:
        handle.write(text)
    print("wrote %d item specs to %s" % (len(specs), pk.rel(SPEC_PATH)))


if __name__ == "__main__":
    main()
