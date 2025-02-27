from typing import Dict, Tuple, NamedTuple
import json
import os
from pyarabic import araby

class LetterProperties(NamedTuple):
    arabic: str
    ebced: int
    element: str
    is_nurani: bool  # True for Nurani (N), False for Zulmani (Z)
    is_eril: bool    # True for Eril (E), False for Dişil (D)

def normalize_arabic_char(char: str) -> str:
    """Arapça karakteri normalize eder"""
    # Sadece te normalizasyonunu kullan (ة -> ه)
    return araby.normalize_teh(char)

def get_unicode_value(char: str) -> str:
    """Karakterin Unicode değerini güvenli bir şekilde alır"""
    try:
        if len(char) == 1:
            return f"{ord(char):04x}"
        return "+".join(f"{ord(c):04x}" for c in char)
    except TypeError:
        return "invalid"

def load_letter_properties():
    current_dir = os.path.dirname(os.path.abspath(__file__))
    json_path = os.path.join(current_dir, '..', 'data', 'letter.json')
    
    with open(json_path, 'r', encoding='utf-8') as f:
        data = json.load(f)
    
    letter_props = {}
    element_map = {'A': 'ATEŞ', 'H': 'HAVA', 'T': 'TOPRAK', 'S': 'SU'}
    
    for harf in data['harfler']:
        arabic_char = harf['arapca_harf']
        # Her iki formda da kaydet
        normalized_char = normalize_arabic_char(arabic_char)
        props = LetterProperties(
            arabic=arabic_char,
            ebced=harf['ebced_sayisi'],
            element=element_map[harf['elementi']],
            is_nurani=harf['n_z'] == 'N',
            is_eril=harf['cinsiyeti'] == 'E'
        )
        # Hem orijinal hem de normalize edilmiş hali kaydet
        letter_props[arabic_char] = props
        if normalized_char != arabic_char:
            letter_props[normalized_char] = props
    
    return letter_props

# Harf özelliklerini JSON'dan yükle
LETTER_PROPERTIES = load_letter_properties()

def find_name_in_database(name: str, names_df) -> tuple[str, int] | None:
    """İsmi veritabanında ara ve Arapça karşılığını ve ebced değerini döndür"""
    if names_df is None:
        return None
    
    name = name.lower().strip()
    result = names_df[names_df['name'].str.lower() == name]
    if not result.empty:
        arabic = result.iloc[0]['arabic']
        ebced = result.iloc[0]['ebced']
        return arabic, int(ebced)
    return None

def process_arabic_text(arabic: str) -> list[dict]:
    """Arapça metni işler ve her harfin özelliklerini döndürür"""
    letters = []
    for char in arabic:
        # Önce doğrudan eşleşme ara
        if char in LETTER_PROPERTIES:
            props = LETTER_PROPERTIES[char]
        else:
            # Eşleşme yoksa normalize edilmiş hali dene
            normalized_char = normalize_arabic_char(char)
            if normalized_char in LETTER_PROPERTIES:
                props = LETTER_PROPERTIES[normalized_char]
            else:
                continue
        
        letters.append({
            'letter': char,
            'ebced': props.ebced,
            'element': props.element,
            'nurani_zulmani': 'N' if props.is_nurani else 'Z',
            'gender': 'E' if props.is_eril else 'D'
        })
    
    return letters

def convert_to_arabic_and_calculate_ebced(text: str, names_df=None, is_name=False) -> Tuple[str, int, Dict]:
    """
    Metni Arapça'ya çevirir ve ebced değerini hesaplar
    is_name parametresi True ise isim çevirisi için harf harf çeviri yapar
    """
    try:
        # İsim çevirisi için özel işlem
        if is_name and names_df is not None:
            # Önce veritabanında tam eşleşme ara
            text = text.strip().lower()
            name_match = names_df[names_df['name'].str.lower() == text]
            
            if not name_match.empty:
                # Veritabanında bulundu
                arabic = name_match.iloc[0]['arabic']
                print(f"İsim veritabanında bulundu: {text} -> {arabic}")
            else:
                # Veritabanında bulunamadı, harf harf çevir
                print(f"İsim veritabanında bulunamadı: {text}, harf harf çevriliyor...")
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
                
                # Harf harf çeviri yap
                arabic = ''
                for char in text.lower():
                    arabic_char = char_map.get(char, char)
                    # Eğer harfin karşılığı LETTER_PROPERTIES'de varsa ekle
                    if arabic_char in LETTER_PROPERTIES:
                        arabic += arabic_char
                    else:
                        # Normalize edilmiş halini dene
                        normalized_char = normalize_arabic_char(arabic_char)
                        if normalized_char in LETTER_PROPERTIES:
                            arabic += normalized_char
                
                print(f"Harf harf çeviri sonucu: {text} -> {arabic}")
        else:
            # Normal çeviri işlemi
            if names_df is not None:
                # Veritabanında ara
                text = text.strip().lower()
                name_match = names_df[names_df['name'].str.lower() == text]
                
                if not name_match.empty:
                    arabic = name_match.iloc[0]['arabic']
                    print(f"Veritabanında bulundu: {text} -> {arabic}")
                else:
                    # Veritabanında yoksa normal çeviri
                    arabic = text
            else:
                arabic = text
        
        # Ebced hesaplama ve harf analizi
        total_ebced = 0
        letters = []
        
        for char in arabic:
            if char in LETTER_PROPERTIES:
                props = LETTER_PROPERTIES[char]
                total_ebced += props.ebced
                
                letters.append({
                    'letter': char,
                    'ebced': props.ebced,
                    'element': props.element,
                    'nurani_zulmani': 'N' if props.is_nurani else 'Z',
                    'gender': 'E' if props.is_eril else 'D'
                })
            else:
                # Normalize edilmiş hali dene
                normalized_char = normalize_arabic_char(char)
                if normalized_char in LETTER_PROPERTIES:
                    props = LETTER_PROPERTIES[normalized_char]
                    total_ebced += props.ebced
                    
                    letters.append({
                        'letter': normalized_char,
                        'ebced': props.ebced,
                        'element': props.element,
                        'nurani_zulmani': 'N' if props.is_nurani else 'Z',
                        'gender': 'E' if props.is_eril else 'D'
                    })
        
        result = {
            'letters': letters,
            'total_ebced': total_ebced
        }
        
        return arabic, total_ebced, result
        
    except Exception as e:
        print(f"Hata: {str(e)}")
        raise e

def calculate_name_ebced(name: str) -> int:
    """İsmin ebced değerini hesaplar"""
    _, ebced, _ = convert_to_arabic_and_calculate_ebced(name)
    return ebced 