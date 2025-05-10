# backend/library/utils/genre_utils.py

from typing import Dict, List, Set, Optional, Tuple

# Primary genre whitelist - exact matches take priority
PRIMARY_GENRES = {
    # Fiction Genres
    "fantasy", "science fiction", "mystery", "thriller", "horror", 
    "romance", "historical fiction", "literary fiction", "young adult", 
    "children's fiction", "classics", "adventure", "crime fiction", 
    "dystopian", "paranormal", "contemporary fiction", "urban fantasy", 
    "epic fantasy", "dark fantasy", "high fantasy", "magical realism", 
    "cyberpunk", "steampunk", "space opera", "suspense", "detective", 
    "drama", "action", "speculative fiction", "comedy", "satire", 
    "western", "coming of age", "gothic", "supernatural", "alternate history", 
    "time travel", "war fiction", "political fiction", "psychological fiction",
    "erotic fiction", "fantasy romance", "mythology", "fairy tales", "folklore",
    "short stories", "anthology", "chick lit", "new adult", "historical romance",
    "paranormal romance", "regency romance", "medical romance", "crime thriller",
    "legal thriller", "psychological thriller", "spy thriller", "military fiction",
    "sword and sorcery", "hard science fiction", "soft science fiction", "lgbtq+ fiction",
    "domestic fiction", "family saga", "women's fiction", "historical mystery",
    
    # Non-Fiction Genres
    "non-fiction", "biography", "memoir", "autobiography", "history",
    "true crime", "science", "philosophy", "psychology", "self-help",
    "business", "economics", "politics", "travel", "cookbooks", "food writing",
    "art", "music", "religion", "spirituality", "health", "fitness",
    "sports", "nature", "environment", "technology", "computers", "reference",
    "education", "parenting", "cultural studies", "journalism", "essays",
    "literary criticism", "language", "humor", "true adventure",
    
    # Poetry and Drama
    "poetry", "drama", "plays", "sonnets", "epic poetry", "lyric poetry",
    
    # Academic and Specialized
    "academic", "textbook", "research", "sociology", "anthropology",
    "linguistics", "mathematics", "physics", "chemistry", "biology",
    "medicine", "law", "engineering", "architecture"
}

# This maps common variations and subcategories to our primary genres
GENRE_MAPPING = {
    # Fantasy variations
    "fantasy fiction": "fantasy",
    "english fantasy fiction": "fantasy",
    "fantasy fiction, english": "fantasy",
    "fiction, fantasy, epic": "epic fantasy",
    "fiction, fantasy, general": "fantasy",
    "heroic fantasy": "epic fantasy",
    "sword & sorcery": "sword and sorcery",
    "fairy tales & folklore": "fairy tales",
    "myths & legends": "mythology",
    "mythological fiction": "mythology",
    
    # Science Fiction variations
    "science fiction, american": "science fiction",
    "science fiction, english": "science fiction",
    "science-fiction": "science fiction",
    "scifi": "science fiction",
    "sci-fi": "science fiction",
    "speculative fiction": "science fiction",
    "space exploration": "space opera",
    "futuristic fiction": "science fiction",
    "technological fiction": "science fiction",
    "post-apocalyptic": "dystopian",
    "space warfare": "space opera",
    "alien contact": "science fiction",
    "artificial intelligence": "science fiction",
    
    # Mystery/Thriller variations
    "mystery fiction": "mystery",
    "mystery & detective": "detective",
    "detective and mystery stories": "detective",
    "thrillers": "thriller",
    "psychological thriller": "psychological thriller",
    "crime thriller": "crime thriller",
    "spy stories": "spy thriller",
    "espionage": "spy thriller",
    "murder mystery": "mystery",
    "cozy mystery": "mystery",
    "police procedural": "crime fiction",
    "legal stories": "legal thriller",
    "courtroom drama": "legal thriller",
    "noir": "crime fiction",
    "hard-boiled": "crime fiction",
    "private investigator": "detective",
    "whodunit": "mystery",

    # Literary variations
    "fiction in english": "literary fiction",
    "literature": "literary fiction", 
    "english literature": "literary fiction",
    "american literature": "literary fiction",
    "canadian literature": "literary fiction",
    "australian literature": "literary fiction",
    "european literature": "literary fiction",
    "general fiction": "literary fiction",
    "contemporary literature": "contemporary fiction",
    "literary": "literary fiction",
    "classic literature": "classics",
    "literary classics": "classics",
    "great books": "classics",
    
    # YA/Children's variations
    "ya": "young adult",
    "teen fiction": "young adult",
    "juvenile fiction": "children's fiction",
    "children's literature": "children's fiction",
    "middle grade": "children's fiction",
    "picture books": "children's fiction",
    "teen literature": "young adult",
    "young adult literature": "young adult",
    "boarding school": "young adult",
    "coming-of-age": "coming of age",
    
    # Horror variations
    "horror fiction": "horror",
    "horror stories": "horror",
    "ghost stories": "supernatural",
    "occult fiction": "supernatural",
    "supernatural horror": "horror",
    "vampire": "paranormal",
    "werewolf": "paranormal",
    "monsters": "horror",
    "apocalyptic horror": "horror",
    "psychological horror": "horror",
    "lovecraftian": "horror",
    "cosmic horror": "horror",
    
    # Adventure variations
    "adventure fiction": "adventure",
    "adventure stories": "adventure",
    "survival stories": "adventure",
    "sea stories": "adventure",
    "wilderness survival": "adventure",
    "exploration": "adventure",
    "quest": "adventure",
    
    # Romance variations
    "love stories": "romance",
    "romantic suspense": "romance",
    "historical romance fiction": "historical romance",
    "regency": "regency romance",
    "medieval romance": "historical romance",
    "contemporary romance": "romance",
    "romantic comedy": "romance",
    "romantic drama": "romance",
    "medical romance fiction": "medical romance",
    
    # Historical variations
    "historical": "historical fiction",
    "history": "history",
    "historical novel": "historical fiction",
    "historical adventure": "historical fiction",
    "ancient history": "history",
    "medieval history": "history",
    "modern history": "history",
    "world history": "history",
    "american history": "history",
    "european history": "history",
    "asian history": "history",
    "african history": "history",
    "military history": "history",
    
    # War variations
    "war stories": "war fiction",
    "war fiction": "war fiction",
    "military fiction": "military fiction",
    "military science fiction": "science fiction",
    "world war, 1939-1945": "war fiction",
    "world war, 1914-1918": "war fiction",
    "civil war": "war fiction",
    "vietnam war": "war fiction",
    
    # Non-fiction variations
    "autobiography": "autobiography",
    "personal narratives": "memoir",
    "personal memoirs": "memoir",
    "diaries": "memoir",
    "letters": "memoir",
    "correspondence": "memoir",
    "essays & travelogues": "essays",
    "biographies": "biography",
    "true crime stories": "true crime",
    "sociology": "sociology",
    "psychology": "psychology",
    "self-improvement": "self-help",
    "business & economics": "business",
    "political science": "politics",
    "travel writing": "travel",
    "cookery": "cookbooks",
    "philosophy, modern": "philosophy",
    "religious": "religion",
    "spiritualism": "spirituality",
    "christian life": "religion",
    "buddhism": "religion",
    "islam": "religion",
    "judaism": "religion",
    "health & fitness": "health",
    "diet": "health",
    "exercise": "fitness",
    "sports & recreation": "sports",
    "nature & wildlife": "nature",
    "environment": "environment",
    "computers": "technology",
    "programming": "computers",
    "reference works": "reference",
    "encyclopedias": "reference",
    "dictionaries": "reference",
    "education & teaching": "education",
    "child rearing": "parenting",
    "family relationships": "parenting",
    
    # Poetry and Drama
    "dramatic works": "drama",
    "shakespeare": "plays",
    "poetic works": "poetry",
    "narrative poetry": "poetry",
    
    # Other common variations
    "bildungsroman": "coming of age",
    "family life": "domestic fiction",
    "family saga": "family saga",
    "feminist fiction": "women's fiction",
    "women's studies": "women's fiction",
    "lgbtq": "lgbtq+ fiction",
    "short stories, american": "short stories",
    "short stories, english": "short stories",
    "anthologies": "anthology",
    "collected works": "anthology"
}

# Keywords that might indicate a valid genre (partial matches)
GENRE_KEYWORDS = {
    "fantasy": "fantasy",
    "fiction": "literary fiction",  # Default if just "fiction" is found
    "mystery": "mystery",
    "thriller": "thriller",
    "horror": "horror",
    "romance": "romance",
    "historical": "historical fiction",
    "adventure": "adventure",
    "young adult": "young adult",
    "children": "children's fiction",
    "crime": "crime fiction",
    "sci-fi": "science fiction",
    "classic": "classics",
    "dystopia": "dystopian",
    "supernatural": "supernatural",
    "paranormal": "paranormal",
    "urban": "urban fantasy",
    "magic": "fantasy",
    "space": "science fiction",
    "detective": "detective",
    "war": "war fiction",
    "spy": "thriller",
    "coming of age": "coming of age",
    "time travel": "time travel",
    "alternate history": "alternate history",
    "cyberpunk": "cyberpunk",
    "steampunk": "steampunk",
    "epic": "epic fantasy",
    "high": "high fantasy",
    "dark": "dark fantasy",
    "psychological": "psychological fiction",
    "political": "political fiction",
    "memoir": "memoir",
    "biography": "biography",
    "history": "history",
    "philosophy": "philosophy",
    "religion": "religion",
    "science": "science",
    "self-help": "self-help",
    "education": "education",
    "business": "business",
    "travel": "travel",
    "cooking": "cookbooks",
    "health": "health",
    "medicine": "medicine",
    "technology": "technology",
    "computer": "computers",
    "academic": "academic",
    "textbook": "textbook",
    "poetry": "poetry",
    "play": "plays",
    "drama": "drama",
    "essay": "essays",
    "short story": "short stories",
    "anthology": "anthology"
}

def normalize_genre(subject: str) -> Optional[str]:
    """
    Normalize a subject from Open Library to a standard genre.
    
    Args:
        subject: The subject string from Open Library
        
    Returns:
        A normalized genre string or None if no match is found
    """
    # Convert to lowercase for case-insensitive matching
    subject_lower = subject.lower().strip()
    
    # 1. Check for exact match in primary genres
    if subject_lower in PRIMARY_GENRES:
        return subject_lower
    
    # 2. Check for match in genre mapping
    if subject_lower in GENRE_MAPPING:
        return GENRE_MAPPING[subject_lower]
    
    # 3. Check for keyword matches
    for keyword, genre in GENRE_KEYWORDS.items():
        if keyword in subject_lower:
            return genre
    
    # No match found
    return None

def extract_genres_from_subjects(subjects: List[str], max_genres: int = 5) -> Set[str]:
    """
    Extract valid genres from a list of subjects.
    
    Args:
        subjects: List of subject strings from Open Library
        max_genres: Maximum number of genres to return
        
    Returns:
        Set of normalized genre strings
    """
    genres = set()
    
    for subject in subjects:
        if not subject:
            continue
            
        genre = normalize_genre(subject)
        if genre:
            genres.add(genre)
            
            # Stop once we reach the maximum number of genres
            if len(genres) >= max_genres:
                break
    
    return genres

def get_primary_genre(genres: Set[str]) -> str:
    """
    Determine the primary genre from a set of genres.
    
    This uses a basic priority system to select the most appropriate
    primary genre when multiple genres are present.
    
    Args:
        genres: Set of normalized genre strings
        
    Returns:
        The primary genre string
    """
    # Priority list for primary genre selection
    priority_genres = [
        "fantasy", "science fiction", "mystery", "thriller",
        "horror", "romance", "historical fiction", "literary fiction",
        "classics", "young adult", "children's fiction"
    ]
    
    # Check for genres in priority order
    for genre in priority_genres:
        if genre in genres:
            return genre
    
    # If no priority genre is found, return the first one alphabetically
    return sorted(genres)[0] if genres else "fiction"