import pandas as pd
from typing import Optional, Tuple
from models.schemas import EsmaInfo

def find_nearest_ebced_values(target_ebced: int, df: pd.DataFrame) -> tuple:
    """En yakın alt ve üst ebced değerlerini bulur"""
    ebced_values = df['ebced'].unique()
    ebced_values = sorted(ebced_values)
    
    # Alt değeri bul
    lower_values = [x for x in ebced_values if x < target_ebced]
    lower = max(lower_values) if lower_values else None
    
    # Üst değeri bul
    upper_values = [x for x in ebced_values if x > target_ebced]
    upper = min(upper_values) if upper_values else None
    
    return lower, upper

def get_esma_info(ebced_value: float, df: pd.DataFrame) -> Optional[EsmaInfo]:
    """Belirli bir ebced değeri için esma bilgilerini döndürür"""
    if pd.isna(ebced_value):
        return None
        
    row = df[df['ebced'] == ebced_value].iloc[0]
    return EsmaInfo(
        ebced=int(row['ebced']),
        name=str(row['esma']),
        arabic=str(row['arabic']),
        meaning=str(row['meaning'])
    ) 