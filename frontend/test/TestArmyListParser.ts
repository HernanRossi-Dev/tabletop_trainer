import { parseArmyList } from "../src/modules/ArmyListParser";

// --- Example Usage with the Black Templars list ---
const armyListTextBT = `
Righteous Fury (1980 points)

Space Marines
Black Templars
Strike Force (2000 points)
Righteous Crusaders


CHARACTERS

Chaplain Grimaldus (130 points)
  • 1x Chaplain Grimaldus
    • Warlord
    • 1x Artificer crozius
      1x Plasma pistol
  • 3x Cenobyte Servitor
    • 3x Close combat weapon

High Marshal Helbrecht (130 points)
  • 1x Ferocity
    1x Sword of the High Marshals

Techmarine (65 points)
  • 1x Forge bolter
    1x Grav-pistol
    1x Omnissian power axe
    1x Servo-arm
  • Enhancement: Witchseeker Bolts

The Emperor’s Champion (75 points)
  • 1x Black Sword
    1x Bolt Pistol


BATTLELINE

Primaris Crusader Squad (320 points)
  • 1x Primaris Sword Brother
    • 1x Heavy bolt pistol
      1x Power weapon
  • 11x Primaris Initiate
    • 11x Bolt pistol
      11x Bolt rifle
      11x Close combat weapon
  • 8x Primaris Neophyte
    • 8x Astartes chainsword
      8x Bolt pistol

Primaris Crusader Squad (320 points)
  • 1x Primaris Sword Brother
    • 1x Heavy bolt pistol
      1x Power weapon
  • 11x Primaris Initiate
    • 11x Bolt pistol
      11x Bolt rifle
      11x Close combat weapon
  • 8x Primaris Neophyte
    • 8x Astartes chainsword
      8x Bolt pistol


OTHER DATASHEETS

Ballistus Dreadnought (140 points)
  • 1x Armoured feet
    1x Ballistus lascannon
    1x Ballistus missile launcher
    1x Twin storm bolter

Black Templars Repulsor Executioner (230 points)
  • 1x Armoured hull
    1x Heavy onslaught gatling cannon
    1x Macro plasma incinerator
    1x Repulsor Executioner defensive array
    1x Twin Icarus ironhail heavy stubber
    1x Twin heavy bolter

Primaris Sword Brethren (150 points)
  • 1x Sword Brother Castellan
    • 1x Astartes chainsword
      1x Heavy bolt pistol
  • 4x Primaris Sword Brother
    • 4x Astartes chainsword
      4x Heavy bolt pistol

Redemptor Dreadnought (210 points)
  • 1x Icarus rocket pod
    1x Macro plasma incinerator
    1x Onslaught gatling cannon
    1x Redemptor fist
    1x Twin fragstorm grenade launcher

Redemptor Dreadnought (210 points)
  • 1x Icarus rocket pod
    1x Macro plasma incinerator
    1x Onslaught gatling cannon
    1x Redemptor fist
    1x Twin fragstorm grenade launcher

Exported with App Version: v1.32.1 (78), Data Version: v599
`;

// --- Example Usage with the first T'au list ---
const armyListTextTau1 = `
For the Greatest Good (1990 points)

T’au Empire
Strike Force (2000 points)
Auxiliary Cadre


CHARACTERS
... (rest of list) ...
`;

console.log("--- Black Templars Parsing ---");
const parsedResultBT = parseArmyList(armyListTextBT);

if (parsedResultBT) {
    console.log(`Army Name: ${parsedResultBT.armyName}`);
    console.log(`Army Size: ${parsedResultBT.armySizePoints} points`);
    console.log(`Faction: ${parsedResultBT.faction}`); // Should be Black Templars
    console.log(`Detachment: ${parsedResultBT.detachment}`); // Should be Righteous Crusaders
    // ... rest of printing ...
    console.log(`Characters found: ${parsedResultBT.characters.length}`);
    console.log(`Other units found: ${parsedResultBT.otherDatasheets.length}`);
} else {
    console.log("Parsing failed.");
}

console.log("\n--- T'au Parsing ---");
// Use only the header part for brevity in this example run
const parsedResultTau1 = parseArmyList(armyListTextTau1.substring(0, armyListTextTau1.indexOf('CHARACTERS')));

if (parsedResultTau1) {
    console.log(`Army Name: ${parsedResultTau1.armyName}`);
    console.log(`Army Size: ${parsedResultTau1.armySizePoints} points`);
    console.log(`Faction: ${parsedResultTau1.faction}`); // Should be T'au Empire
    console.log(`Detachment: ${parsedResultTau1.detachment}`); // Should be Auxiliary Cadre
     console.log(`Characters found: ${parsedResultTau1.characters.length}`); // Will be 0 as we cut the text
    console.log(`Other units found: ${parsedResultTau1.otherDatasheets.length}`); // Will be 0
} else {
    console.log("Parsing failed.");
}