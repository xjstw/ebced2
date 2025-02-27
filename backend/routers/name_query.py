from fastapi import APIRouter, HTTPException
from models.schemas import NameRequest, NameResponse, EsmaInfo, LetterAnalysis
from utils.arabic_converter import convert_to_arabic_and_calculate_ebced
from utils.common import find_nearest_ebced_values
import pandas as pd

router = APIRouter()

# Global değişkenler
names_df = None
esma_df = None

def init_dataframes(names: pd.DataFrame, esmas: pd.DataFrame):
    """DataFrame'leri başlatır"""
    global names_df, esma_df
    names_df = names
    esma_df = esmas

def get_esma_info(ebced_value: int, df: pd.DataFrame) -> EsmaInfo:
    """Verilen ebced değerine sahip esma bilgisini döndürür"""
    try:
        # Ebced değerlerini integer'a çevir
        df['ebced'] = pd.to_numeric(df['ebced'], errors='coerce')
        df = df.dropna(subset=['ebced'])  # NaN değerleri olan satırları çıkar
        
        matching_rows = df[df['ebced'] == ebced_value]
        if matching_rows.empty:
            print(f"Ebced {ebced_value} için eşleşme bulunamadı")
            return None
            
        row = matching_rows.iloc[0]
        print(f"Bulunan esma: {row['esma']}, Ebced: {row['ebced']}, Anlam: {row['meaning']}")  # Debug için
        
        return EsmaInfo(
            ebced=int(row['ebced']),
            name=str(row['esma']).strip(),
            arabic=str(row['arabic']).strip(),
            meaning=str(row['meaning']).strip()
        )
    except Exception as e:
        print(f"get_esma_info hatası: {str(e)}")
        print(f"Aranan ebced değeri: {ebced_value}")
        print(f"Mevcut sütunlar: {df.columns.tolist()}")
        print(f"DataFrame örnek veri:")
        print(df.head())
        raise

def find_nearest_ebced_values(target_ebced: int, df: pd.DataFrame) -> tuple:
    """En yakın alt ve üst ebced değerlerini bulur"""
    try:
        # Ebced değerlerini integer'a çevir
        df['ebced'] = pd.to_numeric(df['ebced'], errors='coerce')
        df = df.dropna(subset=['ebced'])
        
        ebced_values = sorted(df['ebced'].unique())
        
        # Alt değeri bul
        lower_values = [x for x in ebced_values if x < target_ebced]
        lower = max(lower_values) if lower_values else None
        
        # Üst değeri bul
        upper_values = [x for x in ebced_values if x > target_ebced]
        upper = min(upper_values) if upper_values else None
        
        print(f"Hedef ebced: {target_ebced}")
        print(f"Alt değer: {lower}, Üst değer: {upper}")
        
        return lower, upper
    except Exception as e:
        print(f"find_nearest_ebced_values hatası: {str(e)}")
        raise

@router.post("/calculate", response_model=NameResponse)
async def calculate_ebced(request: NameRequest):
    try:
        # İsmi küçük harfe çevir ve boşlukları temizle
        name = request.name.lower().strip()
        print(f"İşlenen isim: {name}")  # Debug için

        # İsim analizi yap
        name_arabic, name_ebced, name_result = convert_to_arabic_and_calculate_ebced(request.name, names_df, is_name=True)
        name_letters = [
            LetterAnalysis(
                letter=letter['letter'],
                ebced=letter['ebced'],
                element=letter['element'],
                nurani_zulmani=letter['nurani_zulmani'],
                gender=letter['gender']
            )
            for letter in name_result['letters']
        ]
        print(f"Hesaplanan ebced: {name_ebced}")  # Debug için
        print(f"Element dağılımı: {name_result['letters']}")  # Debug için

        # Esma eşleştirmesi yap
        nearest_match = None
        try:
            # Ebced değerlerini integer'a çevir ve NaN değerleri temizle
            clean_df = esma_df.copy()
            clean_df['ebced'] = pd.to_numeric(clean_df['ebced'], errors='coerce')
            clean_df = clean_df.dropna(subset=['ebced'])
            
            # Mevcut ebced değerlerini kontrol et
            unique_ebceds = sorted(clean_df['ebced'].unique().tolist())
            print(f"Mevcut ebced değerleri: {unique_ebceds}")

            # Önce tam eşleşme ara
            matching_esmas = clean_df[clean_df['ebced'] == name_ebced]
            if not matching_esmas.empty:
                print(f"Tam eşleşme bulundu")  # Debug için
                nearest_match = get_esma_info(name_ebced, clean_df)
            else:
                print(f"Tam eşleşme bulunamadı, en yakın değerler aranıyor")  # Debug için
                # En yakın değerleri bul
                lower_ebced, upper_ebced = find_nearest_ebced_values(name_ebced, clean_df)
                print(f"Alt değer: {lower_ebced}, Üst değer: {upper_ebced}")  # Debug için

                if lower_ebced is not None and upper_ebced is not None:
                    # Hangisi daha yakınsa onu seç
                    if abs(name_ebced - lower_ebced) <= abs(name_ebced - upper_ebced):
                        nearest_match = get_esma_info(lower_ebced, clean_df)
                        print(f"Alt değer seçildi: {lower_ebced}")  # Debug için
                    else:
                        nearest_match = get_esma_info(upper_ebced, clean_df)
                        print(f"Üst değer seçildi: {upper_ebced}")  # Debug için
                elif lower_ebced is not None:
                    nearest_match = get_esma_info(lower_ebced, clean_df)
                    print(f"Sadece alt değer mevcut: {lower_ebced}")  # Debug için
                elif upper_ebced is not None:
                    nearest_match = get_esma_info(upper_ebced, clean_df)
                    print(f"Sadece üst değer mevcut: {upper_ebced}")  # Debug için

        except Exception as e:
            print(f"Esma eşleştirmede hata: {str(e)}")  # Debug için
            print(f"Esma DataFrame içeriği:")  # Debug için
            print(f"Sütunlar: {clean_df.columns.tolist()}")
            print(clean_df.head())
            nearest_match = None

        response = NameResponse(
            name=name,
            arabic=name_arabic,
            ebced=name_ebced,
            is_calculated=True,
            nearest_match=nearest_match,
            letters=name_letters
        )
        
        print(f"Dönüş değeri: {response}")  # Debug için
        return response

    except Exception as e:
        print(f"Genel hata: {str(e)}")  # Debug için
        raise HTTPException(status_code=500, detail=str(e)) 