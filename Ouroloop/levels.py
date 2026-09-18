import json

def make_levels_harder(input_filename, output_filename):
    with open(input_filename, 'r') as f:
        levels = json.load(f)

    for i, lvl in enumerate(levels):
        # Apply modifiers only AFTER the first 3 levels (Index 0, 1, 2)
        if i >= 3:
            # 1. Reduce moves by 20% (ensure a minimum of 15 moves)
            lvl['moves'] = max(15, int(lvl['moves'] * 0.8))
            
            # 2. Add extra Parasites
            if len(lvl['parasites']) == 0:
                # Inject a standard vertical sweep if none exist
                lvl['parasites'].append({
                    "x": 11, "y": 2, "dx": 0, "dy": 1, "minLimit": 1, "maxLimit": 10
                })
            else:
                # Add a cross-patrol parasite if one already exists
                first_p = lvl['parasites'][0]
                new_dx = 1 if first_p['dx'] == 0 else 0
                new_dy = 1 if first_p['dy'] == 0 else 0
                lvl['parasites'].append({
                    "x": 5, "y": 5, "dx": new_dx, "dy": new_dy, "minLimit": 2, "maxLimit": 9
                })

            # 3. Add a choke-point Void near the first Essence
            if len(lvl['essences']) > 0:
                target_x = lvl['essences'][0]['x']
                target_y = lvl['essences'][0]['y']
                # Place a void diagonally adjacent to the target essence
                new_void = {"x": max(0, target_x - 1), "y": max(0, target_y - 1)}
                if new_void not in lvl['voids']:
                    lvl['voids'].append(new_void)

    # Save the modified levels
    with open(output_filename, 'w') as f:
        json.dump(levels, f, indent=4)
        
    print(f"Hard mode generated successfully. Saved to {output_filename}")

# Execute the modifier
make_levels_harder('levels.json', 'levels_hard.json')