from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import List, Dict, Optional
import pandas as pd
from utils.arabic_converter import convert_to_arabic_and_calculate_ebced, LETTER_PROPERTIES
from pyarabic import araby

router = APIRouter(
    prefix="/magic-analysis",
    tags=["Büyü Analizi"]
)

# Request ve Response modelleri
class MagicAnalysisRequest(BaseModel):
    mother_name: str
    child_name: str

class LetterAnalysis(BaseModel):
    letter: str
    ebced: int
    element: str
    nurani_zulmani: str
    gender: str

class MagicAnalysisResponse(BaseModel):
    mother_name: str
    mother_arabic: str
    mother_ebced: int
    mother_letters: List[LetterAnalysis]
    
    child_name: str
    child_arabic: str
    child_ebced: int
    child_letters: List[LetterAnalysis]
    
    total_ebced: int
    remainder: int
    issue_type: str
    issue_description: str

# Global değişkenler
names_df = None
esma_df = None

ISSUE_MAP = {
    1: ("Fiziksel", "Kişinin rahatsızlıkları fizikseldir. Fiziksel sağlığına dikkat etmeli. (Bu sonuçlar mutlak ve nihai sonuçlar değildir. Yalnızca ihtimalleri verir. Burada çıkan sonuç ne olursa olsun kişilerin kendilerini koruma altına aldıktan sonra Allah’ın izniyle bir sıkıntı yaşamayacağıdır.)"),
    2: ("Nazar", "Kişinin rahatsızlarının nazardan kaynaklanması muhtemeldir. (İnsanın nazar, büyü, sihir, musallat gibi durumlardan etkilenmesinin temel sebebi günahlarıdır. Günahlarımız bizlerin aura dediğimiz alanda yırtıklar oluşturur ve içeriye negatif enerjilerin girmesine sebep olur. Dolayısıyla bu giren negatif enerjiler de bizleri hasta eder. Günlük olarak tevbe namazı kılmak, tevbe duası yapmak ve tevbe zikri çekmekle beraber yapılan korunma duaları, mümince bir yaşam ve salih ameller ile kişiler, Allah’ın izniyle bu sıkıntılardan kurtulurlar.)"),
    3: ("Sihir", "Kişinin sihirden büyüden etkilenme potansiyeli mevcuttur. (İnsanın nazar, büyü, sihir, musallat gibi durumlardan etkilenmesinin temel sebebi günahlarıdır. Günahlarımız bizlerin aura dediğimiz alanda yırtıklar oluşturur ve içeriye negatif enerjilerin girmesine sebep olur. Dolayısıyla bu giren negatif enerjiler de bizleri hasta eder. Günlük olarak tevbe namazı kılmak, tevbe duası yapmak ve tevbe zikri çekmekle beraber yapılan korunma duaları, mümince bir yaşam ve salih ameller ile kişiler, Allah’ın izniyle bu sıkıntılardan kurtulurlar.)"),
    4: ("Düşük Enerji", "Kişinin rahatsızlıklarının düşük enerjili varlıkların alanına ve iradelerine müdahaleden kaynaklanma potansiyeli vardır. (İnsanın nazar, büyü, sihir, musallat gibi durumlardan etkilenmesinin temel sebebi günahlarıdır. Günahlarımız bizlerin aura dediğimiz alanda yırtıklar oluşturur ve içeriye negatif enerjilerin girmesine sebep olur. Dolayısıyla bu giren negatif enerjiler de bizleri hasta eder. Günlük olarak tevbe namazı kılmak, tevbe duasıyapmak ve tevbe zikri çekmekle beraber yapılan korunma duaları, mümince bir yaşam ve salih ameller ile kişiler, Allah’ın izniyle bu sıkıntılardan kurtulurlar.) Banyo ve tuvalette dikkat edilecek hususlardan bazıları; Banyoda çıplak ve uzun süre kalmamak. Yıkanılan yere bevl etmemek. Gusülde çok dikkatli davranmak. Tuvalette konuşmamak. Tuvalet ve banyoda kısa süreli kalmak. Taharete ihtimam göstermektir. Mutfakta dikkat edilmesi gereken hususlardan bazıları; Lavaboya kaynar su dökmemek. Su dökerken soğuk suyu da açmak. Su dökerken destur demek. Lavabo içerisine yemek artıkları dökmemek. Yemek yenilen alanı yemekten sonra mutlaka süpürmek. Tavuk kemiklerini diğer çöplerle karıştırmamak. Mutfakta çöp ve bulaşık bırakmamak)"),
    5: ("Yel veya Romatizma", "Kişinin rahatsızlıkları yel girmesi veya romatizma kaynaklı olma potansiyeli vardır. (Bu sonuçlar mutlak ve nihai sonuçlar değildir. Yalnızca ihtimalleri verir. Burada çıkan sonuç ne olursa olsun kişilerin kendilerini koruma altına aldıktan sonra Allah’ın izniyle bir sıkıntı yaşamayacağıdır.)"),
    0: ("Yel veya Romatizma", "Kişinin rahatsızlıkları yel girmesi veya romatizma kaynaklı olma potansiyeli vardır. (Bu sonuçlar mutlak ve nihai sonuçlar değildir. Yalnızca ihtimalleri verir. Burada çıkan sonuç ne olursa olsun kişilerin kendilerini koruma altına aldıktan sonra Allah’ın izniyle bir sıkıntı yaşamayacağıdır.)")
}

def init_dataframes(names: pd.DataFrame, esmas: pd.DataFrame):
    global names_df, esma_df
    names_df = names
    esma_df = esmas

@router.post("/analyze", response_model=MagicAnalysisResponse)
async def analyze_magic_risk(request: MagicAnalysisRequest):
    try:
        # Anne ismini analiz et
        mother_arabic, mother_ebced, mother_result = convert_to_arabic_and_calculate_ebced(request.mother_name, names_df, is_name=True)
        mother_letters = [
            LetterAnalysis(
                letter=letter['letter'],
                ebced=letter['ebced'],
                element=letter['element'],
                nurani_zulmani=letter['nurani_zulmani'],
                gender=letter['gender']
            )
            for letter in mother_result['letters']
        ]
        
        # Çocuk ismini analiz et
        child_arabic, child_ebced, child_result = convert_to_arabic_and_calculate_ebced(request.child_name, names_df, is_name=True)
        child_letters = [
            LetterAnalysis(
                letter=letter['letter'],
                ebced=letter['ebced'],
                element=letter['element'],
                nurani_zulmani=letter['nurani_zulmani'],
                gender=letter['gender']
            )
            for letter in child_result['letters']
        ]
        
        # Toplam ebced değerini ve kalanı hesapla
        total_ebced = mother_ebced + child_ebced
        remainder = total_ebced % 5
        
        # Manevi sıkıntı türünü ve açıklamasını al
        issue_type, issue_description = ISSUE_MAP[remainder]
        
        return MagicAnalysisResponse(
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
            issue_type=issue_type,
            issue_description=issue_description
        )
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e)) 