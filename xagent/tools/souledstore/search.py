"""
Semantic Search Implementation using Sentence Transformers

This script loads product data from products.json, extracts page URLs and descriptions,
and finds the top 3 closest matches to a user query using sentence transformers.
"""

import json
import torch
from pathlib import Path
from sentence_transformers import SentenceTransformer

def load_products(file_path=None):
    """Load products from JSON file and extract page URLs and descriptions."""
    if file_path is None:
        # Default to a products.json file in the same directory as this script
        file_path = Path(__file__).parent / 'products.json'
    
    with open(file_path, 'r') as f:
        data = json.load(f)
    
    products = []
    for item in data['results']:
        products.append({
            'page_url': item['page_url'],
            'description': item['description'],
            'metadata': item.get('metadata', {})
        })
    
    return products

def search_products(query, products, model, top_k=3):
    """Search for products that match the query using semantic similarity."""
    # Extract descriptions for encoding
    descriptions = [p['description'] for p in products]
    
    # Encode descriptions and query
    corpus_embeddings = model.encode(descriptions, convert_to_tensor=True)
    query_embedding = model.encode(query, convert_to_tensor=True)
    
    # Calculate similarity scores
    cos_scores = torch.nn.functional.cosine_similarity(query_embedding.unsqueeze(0), corpus_embeddings)
    
    # Get top-k indices
    top_scores, top_indices = torch.topk(cos_scores, k=min(top_k, len(products)))
    
    # Prepare results
    results = []
    for score, idx in zip(top_scores, top_indices):
        results.append({
            'page_url': products[idx]['page_url'],
            'description': products[idx]['description'],
            'metadata': products[idx].get('metadata', {}),
            'score': score.item()
        })
    
    return results

# Initialize the model at module level for reuse
model = None

def get_model():
    """Get or initialize the sentence transformer model."""
    global model
    if model is None:
        model = SentenceTransformer('all-MiniLM-L6-v2')
    return model

def find_top_matches(query, top_k=3, file_path=None):
    """Find top matching products for a query.
    
    Args:
        query: Search query string
        top_k: Number of top results to return
        file_path: Optional path to products.json
        
    Returns:
        List of matching products with URLs, descriptions, and scores
    """
    # Load the model if not already loaded
    model = get_model()
    
    # Load products
    products = load_products(file_path)
    
    # Search for products
    return search_products(query, products, model, top_k=top_k)
