import logging
import os
from google import genai
from google.genai import types

from .parameters import GOOGLEAI_API_KEY

log = logging.getLogger(__name__)

GEMINI_MODEL = "gemini-2.5-flash-preview-04-17"

class GenClient:
    _client: genai.Client

    @property
    def list_models(self):
        log.info(f'List models: {[model for model in self._client.models.list()]}')
        
    def __init__(self):
        self._client = genai.Client(
            api_key=GOOGLEAI_API_KEY,
            http_options=types.HttpOptions(api_version='v1alpha')
        )


    def read_rules_file(self) -> str:
        rules_path = os.path.join(os.path.dirname(__file__), "../instructions/rules.txt")
        try:
            with open(rules_path, "r", encoding="utf-8") as f:
                return f.read()
        except Exception as e:
            log.error(f"Error reading rules.txt: {e}")
            return ""
    
    def get_system_instructions(self, battle_state) -> str:
        system_instructions =  [
            "*****Your Instructions********", 
            "You are an AI Oppenent for a Player who wants to play a practive game of Warhammer 40K. YOu are an expert of the latest rules for all factions and detachments of 40K. You will speak to your oppenent as an experienced commander in the 40K universe.",
            f"Your Opponent is playing {battle_state.player_army} and you are playing {battle_state.opponent_army}.\n",
            f"************** Here is the current history of the battle messages: {battle_state.battle_log}.\n\n",
            f"Here are the rules for the game: {self.read_rules_file()}\n"
        ]
        return "\n".join(system_instructions)
    
    def generate(self, content: str, battle_state: str) -> str:
        """
        Generates content using the Gemini model.
        Args:
            content (str): The content to generate.
            battle_state (str): The current battle state.
        Returns:
            str: The generated content.
        """
        log.info(f"Generating content with battle state: {battle_state}")
        response = self._client.models.generate_content(
            model=GEMINI_MODEL,
            contents=content,
                config=types.GenerateContentConfig(
                system_instruction=self.get_system_instructions(battle_state)
            ),
        )
        log.info(f"Response: {response.text}")
        return response.text