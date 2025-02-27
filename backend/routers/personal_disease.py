from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import List, Dict, Optional, Tuple
import pandas as pd
from utils.arabic_converter import convert_to_arabic_and_calculate_ebced, LETTER_PROPERTIES
from pyarabic import araby
from googletrans import Translator

router = APIRouter(
    prefix="/personal-disease",
    tags=["Kişiye Özel Hastalık Sorgu"]
)

# Request ve Response modelleri
class PersonalDiseaseRequest(BaseModel):
    mother_name: str
    child_name: str
    disease_name: str

class LetterAnalysis(BaseModel):
    letter: str
    ebced: int
    element: str
    nurani_zulmani: str
    gender: str

class ElementAnalysis(BaseModel):
    count: int
    ebced: int

class NuraniAnalysis(BaseModel):
    total_count: int
    total_ebced: int
    elements: Dict[str, ElementAnalysis]
    dominant_element: str

class PersonAnalysis(BaseModel):
    name: str
    arabic: str
    nurani_analysis: NuraniAnalysis
    letters: List[LetterAnalysis]

class EsmaRecommendation(BaseModel):
    name: str
    arabic: str
    ebced: int
    meaning: str
    element_counts: Dict[str, int]
    selection_reason: str

class VerseRecommendation(BaseModel):
    surah_number: int
    verse_number: int
    surah_name: str
    arabic_text: str
    turkish_meaning: str

class PersonalDiseaseResponse(BaseModel):
    mother: PersonAnalysis
    child: PersonAnalysis
    disease: PersonAnalysis
    combined_analysis: NuraniAnalysis
    recommended_esmas: List[EsmaRecommendation]
    recommended_verses: List[VerseRecommendation]
    warning_message: str = "Şifalanmak için esmaları ve ayetleri en az 21 gün, istediğiniz sayıda okuyabilirsiniz."

# Global değişkenler
names_df = None
esma_df = None
quran_df = None
translator = Translator()

def init_dataframes(names: pd.DataFrame, esmas: pd.DataFrame, quran: pd.DataFrame = None):
    """Veritabanlarını başlatır"""
    global names_df, esma_df, quran_df
    names_df = names
    esma_df = esmas
    quran_df = quran  # Kuran veritabanını da başlat

def analyze_nurani_letters(letters: List[LetterAnalysis]) -> NuraniAnalysis:
    """Nurani harfleri analiz eder"""
    element_counts = {'ATEŞ': {'count': 0, 'ebced': 0},
                     'HAVA': {'count': 0, 'ebced': 0},
                     'TOPRAK': {'count': 0, 'ebced': 0},
                     'SU': {'count': 0, 'ebced': 0}}
    
    total_count = 0
    total_ebced = 0
    
    # Sadece nurani harfleri say
    for letter in letters:
        if letter.nurani_zulmani == 'N':  # Sadece nurani harfleri işle
            element_counts[letter.element]['count'] += 1
            element_counts[letter.element]['ebced'] += letter.ebced
            total_count += 1
            total_ebced += letter.ebced
    
    # Baskın elementi bul (sadece nurani harflere göre)
    max_count = 0
    dominant_element = 'ATEŞ'  # Varsayılan değer
    for element, data in element_counts.items():
        if data['count'] > max_count:
            max_count = data['count']
            dominant_element = element
        elif data['count'] == max_count:  # Eğer eşit sayıda varsa ebced değerine bak
            if data['ebced'] > element_counts[dominant_element]['ebced']:
                dominant_element = element
    
    # ElementAnalysis objelerine dönüştür
    elements = {
        element: ElementAnalysis(count=data['count'], ebced=data['ebced'])
        for element, data in element_counts.items()
    }
    
    return NuraniAnalysis(
        total_count=total_count,
        total_ebced=total_ebced,
        elements=elements,
        dominant_element=dominant_element
    )

def find_matching_esmas(element: str, ebced: int, elements: Dict[str, ElementAnalysis]) -> List[EsmaRecommendation]:
    """Verilen kriterlere göre uygun esmaları bulur"""
    if esma_df is None:
        raise HTTPException(status_code=500, detail="Esma veritabanı başlatılmamış")
    
    # Ebced değerine en yakın esmaları bul
    closest_esmas = []
    min_diff = float('inf')
    
    # İlk olarak element ebced değerine en yakın esmaları bul (72 için)
    for _, row in esma_df.iterrows():
        diff = abs(row['ebced'] - ebced)
        if diff < min_diff:
            min_diff = diff
            closest_esmas = [row]
        elif diff == min_diff:
            closest_esmas.append(row)
    
    # Element sayılarına göre filtrele ve sırala
    recommendations = []
    for esma in closest_esmas:
        # Esmanın element dağılımını hesapla (sadece nurani harfler)
        element_counts = {'ATEŞ': 0, 'HAVA': 0, 'TOPRAK': 0, 'SU': 0}
        arabic = str(esma['arabic'])
        nurani_count = 0
        
        for char in arabic:
            if char in LETTER_PROPERTIES:
                props = LETTER_PROPERTIES[char]
                if props.is_nurani:  # Sadece nurani harfleri say
                    element_counts[props.element] += 1
                    nurani_count += 1
        
        # Baskın elementi bul (sadece nurani harflere göre)
        max_count = 0
        dominant_element = element
        for elem, count in element_counts.items():
            if count > max_count:
                max_count = count
                dominant_element = elem
        
        # Seçim kriterlerini uygula
        if element_counts[element] > 0:  # İstenen elementten en az 1 tane varsa
            selection_reason = f"Ebced değeri ({ebced})'e yakın ve {element_counts[element]} adet {element} elementi içeriyor"
            recommendations.append(EsmaRecommendation(
                name=esma['esma'],
                arabic=esma['arabic'],
                ebced=int(esma['ebced']),
                meaning=esma['meaning'],
                element_counts=element_counts,
                selection_reason=selection_reason
            ))
    
    # İkinci olarak toplam nurani ebced değerine en yakın esmaları bul (212 için)
    total_ebced = sum(elements[e].ebced for e in elements)
    min_diff = float('inf')
    second_recommendations = []
    
    for _, row in esma_df.iterrows():
        diff = abs(row['ebced'] - total_ebced)
        if diff < min_diff:
            min_diff = diff
            second_recommendations = [(row, diff)]
        elif diff == min_diff:
            second_recommendations.append((row, diff))
    
    # İkinci grup esmaları da ekle
    for esma, diff in second_recommendations:
        element_counts = {'ATEŞ': 0, 'HAVA': 0, 'TOPRAK': 0, 'SU': 0}
        arabic = str(esma['arabic'])
        
        for char in arabic:
            if char in LETTER_PROPERTIES:
                props = LETTER_PROPERTIES[char]
                if props.is_nurani:
                    element_counts[props.element] += 1
        
        if element_counts[element] > 0:  # İstenen elementten en az 1 tane varsa
            selection_reason = f"Toplam nurani ebced değeri ({total_ebced})'e yakın ve {element_counts[element]} adet {element} elementi içeriyor"
            recommendations.append(EsmaRecommendation(
                name=esma['esma'],
                arabic=esma['arabic'],
                ebced=int(esma['ebced']),
                meaning=esma['meaning'],
                element_counts=element_counts,
                selection_reason=selection_reason
            ))
    
    # Önerileri ebced farkına göre sırala
    recommendations.sort(key=lambda x: abs(x.ebced - ebced))
    
    return recommendations[:2]  # En uygun 2 esmayı döndür

def find_verse_by_numbers(surah_number: int, verse_number: int, calculation_type: str, steps: List[str]) -> Optional[VerseRecommendation]:
    """Sure ve ayet numarasına göre ayet bulur"""
    if quran_df is None:
        print("Quran DataFrame başlatılmamış!")
        return None
    
    print(f"\nAyet hesaplama: Sure {surah_number}, Ayet {verse_number}")
    original_surah = surah_number
    original_verse = verse_number
    
    # Eğer sure numarası 114'ten büyükse sadeleştir
    if surah_number > 114:
        surah_number = sum(int(digit) for digit in str(surah_number))
        print(f"Sure numarası sadeleştirildi: {original_surah} -> {surah_number}")
    
    # Eğer ayet numarası çok büyükse sadeleştir
    if verse_number > 286:  # En uzun sure olan Bakara suresi 286 ayet
        verse_number = sum(int(digit) for digit in str(verse_number))
        print(f"Ayet numarası sadeleştirildi: {original_verse} -> {verse_number}")
    
    print(f"Aranacak sure no ve ayet: Sure No: {surah_number}, Ayet No: {verse_number}")
    
    verses = quran_df[
        (quran_df['surah_number'] == surah_number)
    ]
    
    if verses.empty:
        print(f"Sure bulunamadı: {surah_number}")
        return None
    
    print(f"Sure bulundu, ayet sayısı: {len(verses)}")
    
    # Eğer sure kısa ise (örn. 7 ayetten az) tüm sureyi öner
    if len(verses) <= 7:
        verse = verses.iloc[0]
        print("Kısa sure olduğu için tamamı öneriliyor")
        
        # Tüm ayetlerin Arapça metinlerini birleştir
        arabic_texts = []
        turkish_meanings = []
        for _, v in verses.iterrows():
            if pd.notna(v['arabic_text']):
                arabic_texts.append(v['arabic_text'])
            if pd.notna(v['turkish_meaning']):
                turkish_meanings.append(v['turkish_meaning'])
        
        return VerseRecommendation(
            surah_number=int(verse['surah_number']),
            verse_number=1,  # İlk ayetten başla
            surah_name=verse['surah_name'],
            arabic_text="\n".join(arabic_texts),
            turkish_meaning="\n".join(turkish_meanings)
        )
    
    # Belirtilen ayet varsa onu döndür
    specific_verse = verses[verses['verse_number'] == verse_number]
    if not specific_verse.empty:
        verse = specific_verse.iloc[0]
        print(f"İstenen ayet bulundu: {verse_number}")
        return VerseRecommendation(
            surah_number=int(verse['surah_number']),
            verse_number=int(verse['verse_number']),
            surah_name=verse['surah_name'],
            arabic_text=str(verse['arabic_text']) if pd.notna(verse['arabic_text']) else "",
            turkish_meaning=str(verse['turkish_meaning']) if pd.notna(verse['turkish_meaning']) else ""
        )
    
    # Eğer ayet bulunamadıysa, en yakın ayeti bul
    closest_verse = min(verses['verse_number'], key=lambda x: abs(x - verse_number))
    verse = verses[verses['verse_number'] == closest_verse].iloc[0]
    print(f"En yakın ayet seçildi: {closest_verse}")
    
    return VerseRecommendation(
        surah_number=int(verse['surah_number']),
        verse_number=int(verse['verse_number']),
        surah_name=verse['surah_name'],
        arabic_text=str(verse['arabic_text']) if pd.notna(verse['arabic_text']) else "",
        turkish_meaning=str(verse['turkish_meaning']) if pd.notna(verse['turkish_meaning']) else ""
    )

def find_recommended_verses(nurani_analysis: NuraniAnalysis) -> List[VerseRecommendation]:
    """Önerilen ayetleri bulur"""
    print("\nAyet önerileri hesaplanıyor...")
    print(f"Baskın element: {nurani_analysis.dominant_element}")
    print(f"Element verileri: {nurani_analysis.elements[nurani_analysis.dominant_element]}")
    print(f"Nurani toplam: {nurani_analysis.total_count} harf, {nurani_analysis.total_ebced} ebced")
    
    verses = []
    dominant_element = nurani_analysis.dominant_element
    element_data = nurani_analysis.elements[dominant_element]
    
    # ELEMENTE GÖRE HESAPLAMA - 1
    # Element adet -> Sure, Element ebced -> Ayet
    steps = [
        f"Element hesaplaması (1):",
        f"Baskın element ({dominant_element}) adet sayısı: {element_data.count} -> Sure numarası",
        f"Element ebced değeri: {element_data.ebced} -> Ayet numarası"
    ]
    verse = find_verse_by_numbers(element_data.count, element_data.ebced, "Element-1", steps)
    if verse:
        verses.append(verse)
    
    # ELEMENTE GÖRE HESAPLAMA - 2
    # Element ebced -> Sure (sadeleştirilmiş), Element adet -> Ayet
    simplified_ebced = sum(int(digit) for digit in str(element_data.ebced))
    steps = [
        f"Element hesaplaması (2):",
        f"Baskın element ({dominant_element}) ebced değeri: {element_data.ebced} sadeleştirildi -> Sure numarası: {simplified_ebced}",
        f"Element adet sayısı: {element_data.count} -> Ayet numarası"
    ]
    verse = find_verse_by_numbers(simplified_ebced, element_data.count, "Element-2", steps)
    if verse:
        verses.append(verse)
    
    # NURANİSİNE GÖRE HESAPLAMA - 1
    # Nurani adet -> Sure, Nurani ebced -> Ayet (sadeleştirilmiş)
    simplified_nurani_ebced = sum(int(digit) for digit in str(nurani_analysis.total_ebced))
    steps = [
        f"Nurani hesaplaması (1):",
        f"Toplam nurani harf sayısı: {nurani_analysis.total_count} -> Sure numarası",
        f"Toplam nurani ebced değeri: {nurani_analysis.total_ebced} sadeleştirildi -> Ayet numarası: {simplified_nurani_ebced}"
    ]
    verse = find_verse_by_numbers(nurani_analysis.total_count, simplified_nurani_ebced, "Nurani-1", steps)
    if verse:
        verses.append(verse)
    
    # NURANİSİNE GÖRE HESAPLAMA - 2
    # Nurani ebced (sadeleştirilmiş) -> Sure, Nurani adet -> Ayet
    steps = [
        f"Nurani hesaplaması (2):",
        f"Sadeleştirilmiş nurani ebced değeri: {simplified_nurani_ebced} -> Sure numarası",
        f"Toplam nurani harf sayısı: {nurani_analysis.total_count} -> Ayet numarası"
    ]
    verse = find_verse_by_numbers(simplified_nurani_ebced, nurani_analysis.total_count, "Nurani-2", steps)
    if verse:
        verses.append(verse)
    
    print(f"Bulunan ayet sayısı: {len(verses)}")
    return verses

def convert_turkish_to_arabic_chars(text: str) -> str:
    """Türkçe harfleri Arapça karakterlere çevirir"""
    char_map = {
        'a': 'ا',
        'b': 'ب',
        'c': 'ج',
        'ç': 'چ',
        'd': 'د',
        'e': 'ه',
        'f': 'ف',
        'g': 'گ',
        'ğ': 'غ',
        'h': 'ح',
        'ı': 'ى',
        'i': 'ي',
        'j': 'ژ',
        'k': 'ك',
        'l': 'ل',
        'm': 'م',
        'n': 'ن',
        'o': 'و',
        'ö': 'و',
        'p': 'پ',
        'r': 'ر',
        's': 'س',
        'ş': 'ش',
        't': 'ت',
        'u': 'و',
        'ü': 'و',
        'v': 'و',
        'y': 'ي',
        'z': 'ز',
    }
    result = ''
    for char in text.lower():
        result += char_map.get(char, char)
    return result

def analyze_disease_and_shifa(disease_name: str) -> Tuple[str, List[LetterAnalysis], NuraniAnalysis]:
    """Hastalık ve şifa kelimelerini analiz eder"""
    try:
        # 1. Hastalık ismini Google Translate ile Arapça'ya çevir
        try:
            disease_arabic = translator.translate(disease_name, src='tr', dest='ar').text
            print(f"Google Translate sonucu: {disease_arabic}")
        except Exception as e:
            print(f"Google Translate hatası: {str(e)}")
            # Hata durumunda manuel çeviriye geri dön
            disease_arabic = convert_turkish_to_arabic_chars(disease_name)
        
        shifa_arabic = "شفاء"  # Şifa kelimesinin Arapçası
        
        # Debug için yazdır
        print(f"\nHastalık ismi: {disease_name}")
        print(f"Hastalık Arapçası: {disease_arabic}")
        print(f"Şifa Arapçası: {shifa_arabic}")
        
        # Hastalık ve şifa kelimelerini ayrı ayrı analiz et
        disease_arabic_text, disease_ebced, disease_result = convert_to_arabic_and_calculate_ebced(disease_arabic, names_df, is_name=True)
        shifa_arabic_text, shifa_ebced, shifa_result = convert_to_arabic_and_calculate_ebced(shifa_arabic, names_df, is_name=True)
        
        # Debug için yazdır
        print("\nHastalık harfleri:")
        for letter in disease_result['letters']:
            print(f"{letter['letter']}: {letter['element']} - {letter['nurani_zulmani']} - Ebced: {letter['ebced']}")
        
        print("\nŞifa harfleri:")
        for letter in shifa_result['letters']:
            print(f"{letter['letter']}: {letter['element']} - {letter['nurani_zulmani']} - Ebced: {letter['ebced']}")
        
        # Birleşik metni oluştur
        combined_text = f"{disease_arabic} {shifa_arabic}"
        
        # Tüm harfleri birleştir
        all_letters = []
        all_letters.extend(disease_result['letters'])
        all_letters.extend(shifa_result['letters'])
        
        # 3. Sadece nurani harfleri seç
        nurani_letters = [
            LetterAnalysis(
                letter=letter['letter'],
                ebced=letter['ebced'],
                element=letter['element'],
                nurani_zulmani=letter['nurani_zulmani'],
                gender=letter['gender']
            )
            for letter in all_letters
            if letter['nurani_zulmani'] == 'N'  # Sadece nurani harfleri al
        ]
        
        # Debug için yazdır
        print("\nSeçilen Nurani harfler:")
        for letter in nurani_letters:
            print(f"{letter.letter}: {letter.element} - Ebced: {letter.ebced}")
        
        # 4. Element ve ebced analizi
        element_counts = {'ATEŞ': {'count': 0, 'ebced': 0},
                         'HAVA': {'count': 0, 'ebced': 0},
                         'TOPRAK': {'count': 0, 'ebced': 0},
                         'SU': {'count': 0, 'ebced': 0}}
        
        total_nurani_count = 0
        total_nurani_ebced = 0
        
        # Her nurani harf için element ve ebced değerlerini topla
        for letter in nurani_letters:
            element_counts[letter.element]['count'] += 1
            element_counts[letter.element]['ebced'] += letter.ebced
            total_nurani_count += 1
            total_nurani_ebced += letter.ebced
        
        # Debug için yazdır
        print("\nElement analizi:")
        for element, data in element_counts.items():
            print(f"{element}: {data['count']} harf - Ebced: {data['ebced']}")
        
        # 5. Baskın elementi belirle
        max_count = 0
        dominant_element = 'ATEŞ'  # Varsayılan değer
        
        for element, data in element_counts.items():
            if data['count'] > max_count:
                max_count = data['count']
                dominant_element = element
            elif data['count'] == max_count:  # Eşit sayıda varsa ebced değerine bak
                if data['ebced'] > element_counts[dominant_element]['ebced']:
                    dominant_element = element
        
        # 6. NuraniAnalysis objesi oluştur
        elements = {
            element: ElementAnalysis(count=data['count'], ebced=data['ebced'])
            for element, data in element_counts.items()
        }
        
        nurani_analysis = NuraniAnalysis(
            total_count=total_nurani_count,
            total_ebced=total_nurani_ebced,
            elements=elements,
            dominant_element=dominant_element
        )
        
        return combined_text, nurani_letters, nurani_analysis
        
    except Exception as e:
        print(f"Hata: {str(e)}")
        raise e

@router.post("/analyze", response_model=PersonalDiseaseResponse)
async def analyze_personal_disease(request: PersonalDiseaseRequest):
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
        mother_nurani = analyze_nurani_letters(mother_letters)
        
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
        child_nurani = analyze_nurani_letters(child_letters)
        
        # Hastalık ve şifa analizi
        disease_arabic, disease_letters, disease_nurani = analyze_disease_and_shifa(request.disease_name)
        
        # Birleşik analiz (sadece nurani harfler)
        combined_elements = {}
        for element in ['ATEŞ', 'HAVA', 'TOPRAK', 'SU']:
            combined_count = (
                mother_nurani.elements[element].count +
                child_nurani.elements[element].count +
                disease_nurani.elements[element].count
            )
            combined_ebced = (
                mother_nurani.elements[element].ebced +
                child_nurani.elements[element].ebced +
                disease_nurani.elements[element].ebced
            )
            combined_elements[element] = ElementAnalysis(
                count=combined_count,
                ebced=combined_ebced
            )
        
        # Baskın elementi bul (sadece nurani harflere göre)
        max_count = 0
        dominant_element = 'ATEŞ'  # Varsayılan değer
        for element, data in combined_elements.items():
            if data.count > max_count:
                max_count = data.count
                dominant_element = element
            elif data.count == max_count:  # Eğer eşit sayıda varsa ebced değerine bak
                if data.ebced > combined_elements[dominant_element].ebced:
                    dominant_element = element
        
        combined_analysis = NuraniAnalysis(
            total_count=mother_nurani.total_count + child_nurani.total_count + disease_nurani.total_count,
            total_ebced=mother_nurani.total_ebced + child_nurani.total_ebced + disease_nurani.total_ebced,
            elements=combined_elements,
            dominant_element=dominant_element
        )
        
        # Esma ve ayet önerileri
        recommended_esmas = find_matching_esmas(
            combined_analysis.dominant_element,
            combined_elements[combined_analysis.dominant_element].ebced,
            combined_elements
        )
        recommended_verses = find_recommended_verses(combined_analysis)
        
        return PersonalDiseaseResponse(
            mother=PersonAnalysis(
                name=request.mother_name,
                arabic=mother_arabic,
                nurani_analysis=mother_nurani,
                letters=mother_letters
            ),
            child=PersonAnalysis(
                name=request.child_name,
                arabic=child_arabic,
                nurani_analysis=child_nurani,
                letters=child_letters
            ),
            disease=PersonAnalysis(
                name=request.disease_name,
                arabic=disease_arabic,
                nurani_analysis=disease_nurani,
                letters=disease_letters
            ),
            combined_analysis=combined_analysis,
            recommended_esmas=recommended_esmas,
            recommended_verses=recommended_verses
        )
        
    except Exception as e:
        print(f"Hastalık analizi başarısız: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e)) 