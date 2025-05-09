import { ArmyDetails } from "../types/BattleType";

/**
 * Parses a Warhammer 40k army list text block into structured data.
 * Finds Faction and Detachment relative to the game size line (e.g., "Strike Force (xxxx points)").
 * Handles various section headers like CHARACTERS, BATTLELINE, OTHER DATASHEETS.
 *
 * @param text A string containing the army list.
 * @returns A ArmyDetails object or null if parsing fails critically.
 */
export function parseArmyList(text: string): ArmyDetails | null {
    // 1. Preprocessing
    const lines = text
        .trim()
        .split('\n')
        .map(line => line.trim())
        .filter(line => line.length > 0);

    if (lines.length < 3) { // Need at least Name/Points, Faction, Game Size lines theoretically
        console.error("Error: Input text is too short for basic structure.");
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

    // --- 2. Parse Header ---
    // Line 0: Army Name and Total Points
    const nameSizeRegex = /^(.*?)\s*\((\d+)\s*points\)$/;
    const matchNameSize = lines[0].match(nameSizeRegex);
    if (!matchNameSize || matchNameSize.length < 3) {
        console.error(`Error: Could not parse Army Name and Size from line: ${lines[0]}`);
        return null; // Critical failure
    }
    parsedData.armyName = matchNameSize[1].trim();
    parsedData.armySizePoints = parseInt(matchNameSize[2], 10);

    // Find Game Size line index, Faction (line before), Detachment (line after)
    let gameSizeLineIndex = -1;
    const gameSizePattern = /\(\d+\s*points\)/; // Pattern to find lines like "(2000 points)"

    // Start searching from line 1 (index 1)
    for (let i = 1; i < lines.length; i++) {
        // Check if it matches the points pattern BUT is NOT the first line (which we already parsed)
        if (gameSizePattern.test(lines[i])) {
            gameSizeLineIndex = i;
            break;
        }
    }

    let startParsingIndex = 0; // Where to start looking for units

    if (gameSizeLineIndex === -1) {
        console.error("Error: Could not find the Game Size line (e.g., 'Strike Force (2000 points)'). Cannot determine Faction/Detachment.");
        // Depending on requirements, you might return null or try to proceed without Faction/Detachment
        return null; // Let's treat this as critical for now
    }

    // Assign Faction (line before game size)
    if (gameSizeLineIndex > 0) {
        parsedData.faction = lines[gameSizeLineIndex - 1];
    } else {
        console.warn("Warning: Game Size line found at index 1. No preceding line for Faction.");
        // Faction remains null
    }

    // Assign Detachment (line after game size)
    if (gameSizeLineIndex < lines.length - 1) {
        const potentialDetachment = lines[gameSizeLineIndex + 1];
        // Basic check: Is it likely a section header or export line instead?
        const sectionHeaderPattern = /^[A-Z\s]+$/;
        if (!sectionHeaderPattern.test(potentialDetachment) && !potentialDetachment.startsWith("Exported with")) {
            parsedData.detachment = potentialDetachment;
            startParsingIndex = gameSizeLineIndex + 2; // Start unit parsing after detachment
        } else {
            console.warn(`Warning: Found possible section header "${potentialDetachment}" or export info where Detachment expected. Detachment set to null.`);
            // Detachment remains null
            startParsingIndex = gameSizeLineIndex + 1; // Start unit parsing immediately after game size line
        }
    } else {
        console.warn("Warning: No line found after Game Size line for Detachment.");
        // Detachment remains null
        startParsingIndex = gameSizeLineIndex + 1; // Start unit parsing immediately after game size line
    }

    // --- 3. Parse Unit Sections ---
    type SectionType = 'CHARACTERS' | 'OTHER' | null;
    let currentSection: SectionType = null;
    let currentUnitLines: string[] = [];

    const unitStartPattern = /^(.*?)\s*\((\d+)\s*points\)$/;
    const sectionHeaderPattern = /^[A-Z\s]+$/; // Re-using for clarity

    const saveCurrentUnit = () => {
        if (currentUnitLines.length > 0) {
            const unitBlock = currentUnitLines.join('\n');
            if (currentSection === 'CHARACTERS') {
                parsedData.characters.push(unitBlock);
            } else if (currentSection === 'OTHER') {
                parsedData.otherDatasheets.push(unitBlock);
            }
        }
        currentUnitLines = [];
    };

    // Start processing lines *after* the determined header section
    for (let i = startParsingIndex; i < lines.length; i++) {
        const line = lines[i];

        if (line.startsWith("Exported with App Version:")) {
            break;
        }

        const isSectionHeader = sectionHeaderPattern.test(line);

        if (isSectionHeader) {
            saveCurrentUnit();
            currentSection = (line === "CHARACTERS") ? 'CHARACTERS' : 'OTHER';
            continue;
        }

        if (currentSection === null) { // Skip blank lines before first section
            continue;
        }

        const isUnitStart = unitStartPattern.test(line);

        if (isUnitStart) {
            saveCurrentUnit();
            currentUnitLines.push(line);
        } else if (currentUnitLines.length > 0) {
            currentUnitLines.push(line);
        }
    }

    // --- 4. Store the very last unit collected ---
    saveCurrentUnit();

    // Final check if critical info is missing
    if (!parsedData.armyName || parsedData.armySizePoints === null || !parsedData.faction) {
        console.warn("Warning: Parsing finished, but some critical header info (Name, Points, Faction) might be missing.");
        // Decide if this should return null based on strictness
    }


    return parsedData;
}
