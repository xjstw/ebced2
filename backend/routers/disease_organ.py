from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from utils.arabic_converter import convert_to_arabic_and_calculate_ebced
import pandas as pd

router = APIRouter(prefix="/disease-organ", tags=["Hastalığa Yatkın Organ Hesaplama"])

class DiseaseOrganRequest(BaseModel):
    mother_name: str
    child_name: str

class LetterAnalysis(BaseModel):
    letter: str
    ebced: int
    arabic: str

class DiseaseOrganResponse(BaseModel):
    mother_name: str
    mother_arabic: str
    mother_ebced: int
    mother_letters: list[LetterAnalysis]
    child_name: str
    child_arabic: str
    child_ebced: int
    child_letters: list[LetterAnalysis]
    total_ebced: int
    remainder: int
    organ: str

ORGAN_MAP = {
    1: "Baş bölgesi",
    2: "Boğaz bölgesi",
    3: "Göğüs bölgesi",
    4: "Üst karın bölgesi",
    5: "Alt karın bölgesi",
    6: "Bacaklar",
    0: "Ayaklar",
    7: "Ayaklar"
}

# Global değişkenler
names_df = None
esma_df = None

def init_dataframes(names: pd.DataFrame, esmas: pd.DataFrame):
    global names_df, esma_df
    names_df = names
    esma_df = esmas

@router.post("/calculate")
async def calculate_disease_organ(request: DiseaseOrganRequest) -> DiseaseOrganResponse:
    try:
        # Analyze mother's name
        mother_arabic, mother_ebced, mother_elements = convert_to_arabic_and_calculate_ebced(request.mother_name, names_df)
        mother_letters = []
        for letter in mother_elements['letters']:
            mother_letters.append(
                LetterAnalysis(
                    letter=letter['letter'],
                    ebced=letter['ebced'],
                    arabic=letter['arabic']
                )
            )
        
        # Analyze child's name
        child_arabic, child_ebced, child_elements = convert_to_arabic_and_calculate_ebced(request.child_name, names_df)
        child_letters = []
        for letter in child_elements['letters']:
            child_letters.append(
                LetterAnalysis(
                    letter=letter['letter'],
                    ebced=letter['ebced'],
                    arabic=letter['arabic']
                )
            )
        
        # Calculate total ebced and remainder
        total_ebced = mother_ebced + child_ebced
        remainder = total_ebced % 7
        if remainder == 0:
            remainder = 7
            
        # Get corresponding organ
        organ = ORGAN_MAP[remainder]
        
        return DiseaseOrganResponse(
            mother_name=request.mother_name,
            mother_arabic=mother_arabic,
            mother_ebced=mother_ebced,
            mother_letters=mother_letters,
            child_name=request.child_name,
            child_arabic=child_arabic,
            child_ebced=child_ebced,
            child_letters=child_letters,
            total_ebced=total_ebced,
            remainder=remainder,
            organ=organ
        )
        
    except Exception as e:
        print(f"Hata: {str(e)}")  # Debug için hata mesajını yazdır
        raise HTTPException(status_code=500, detail=str(e)) 