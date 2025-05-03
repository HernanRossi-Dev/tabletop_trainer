import { ArmyDetails } from "../types/BattleType";


/**
 * Parses a Warhammer 40k army list text block into structured data.
 *
 * @param text A string containing the army list.
 * @returns A ParsedArmyData object or null if parsing fails at the header level.
 */
export function parseArmyList(text: string): ArmyDetails | null {
    // 1. Preprocessing: Split into lines, trim whitespace, remove empty lines
    const lines = text
        .trim()
        .split('\n')
        .map(line => line.trim())
        .filter(line => line.length > 0);

    if (lines.length < 4) {
        console.error("Error: Input text is too short or improperly formatted.");
        return null;
    }

    // Initialize the result object
    const parsedData: ArmyDetails = {
        id: 0,
        armyName: null,
        armySizePoints: null,
        faction: null,
        detachment: null,
        characters: [],
        otherDatasheets: []
    };

    const nameSizeRegex = /^(.*?)\s*\((\d+)\s*points\)$/;
    const matchNameSize = lines[0].match(nameSizeRegex);
    if (!matchNameSize || matchNameSize.length < 3) {
        console.error(`Error: Could not parse Army Name and Size from line: ${lines[0]}`);
        return null; // Critical failure if the first line doesn't match
    }
    parsedData.armyName = matchNameSize[1].trim();
    parsedData.armySizePoints = parseInt(matchNameSize[2], 10); // Use radix 10

    // Line 2: Faction
    if (lines.length > 1) {
      parsedData.faction = lines[1];
    } else {
      console.error("Error: Missing Faction line.");
      return null; // Or handle as optional depending on requirements
    }


    // Line 3: Skip (e.g., "Strike Force (2000 points)") - Handled by line index below

    // Line 4: Detachment
    if (lines.length > 3) {
      parsedData.detachment = lines[3];
    } else {
      console.error("Error: Missing Detachment line.");
      return null; // Or handle as optional
    }


    // --- 3. Parse Sections (Characters and Other Datasheets) ---
    type Section = 'CHARACTERS' | 'OTHER' | null; // Type for section state
    let currentSection: Section = null;
    let currentUnitLines: string[] = [];

    // Regex to identify the start of a unit entry (Name (Points points))
    const unitStartPattern = /^(.*?)\s*\((\d+)\s*points\)$/;

    // Function to save the currently collected unit
    const saveCurrentUnit = () => {
        if (currentUnitLines.length > 0) {
            const unitBlock = currentUnitLines.join('\n');
            if (currentSection === 'CHARACTERS') {
                parsedData.characters.push(unitBlock);
            } else if (currentSection === 'OTHER') {
                parsedData.otherDatasheets.push(unitBlock);
            }
        }
        currentUnitLines = []; // Reset after saving
    };

    // Start processing from line 5 onwards (index 4)
    for (let i = 4; i < lines.length; i++) {
        const line = lines[i];

        // Section Markers
        if (line === "CHARACTERS") {
            saveCurrentUnit(); // Save any unit collected before this marker
            currentSection = "CHARACTERS";
            continue; // Move to the next line
        } else if (line === "OTHER DATASHEETS") {
            saveCurrentUnit(); // Save the last character before switching sections
            currentSection = "OTHER";
            continue; // Move to the next line
        } else if (line.startsWith("Exported with App Version:")) {
             // End of relevant data
             break; // Stop processing
        }

        // Skip lines if we haven't hit a valid section yet
        if (currentSection === null) {
            continue;
        }

        // Check if the line marks the start of a new unit
        const isUnitStart = unitStartPattern.test(line); // Use test for boolean check

        if (isUnitStart) {
            // If we have lines accumulated for a *previous* unit, store them first
            saveCurrentUnit();
            // Start collecting the new unit, beginning with this line
            currentUnitLines.push(line);
        } else if (currentUnitLines.length > 0) {
            // If it's not a unit start and we *are* collecting a unit, append the line
            currentUnitLines.push(line);
        }
        // else: Ignore lines before the first unit in a section (implicitly handled by currentUnitLines being empty)
    }

    // --- 4. Store the very last unit collected ---
    saveCurrentUnit(); // Ensure the last unit read is saved

    return parsedData;
}