#!/usr/bin/env python3
import json
from pathlib import Path
from typing import Dict, List, Any, Optional
from fastmcp import FastMCP

# Create a FastMCP server instance
mcp = FastMCP(name="SouledStoreServer")

# Path to the products JSON file
PRODUCTS_PATH = Path(__file__).parent / "products.json"

# Resource for all products
@mcp.resource("data://souledstore/products")
def get_all_products() -> dict:
    """Provides a list of products from SouledStore."""
    try:
        with open(PRODUCTS_PATH, "r") as f:
            return json.load(f)
    except Exception as e:
        return {"error": f"Could not load products: {str(e)}"}

@mcp.tool()
def find_matching_product(query: str) -> str:
    """
    Find a product that best matches the user's description.
    
    Args:
        query: The user's product description or search query
        
    Returns:
        str: JSON string containing the matching product information with only description and metadata
    """
    try:
        # Load the products data
        data = get_all_products()
        
        # Check if there are any products
        if "results" not in data or not data["results"]:
            return json.dumps({
                "error": "No products available in the catalog."
            }, indent=2)
        
        # Process the data to find the best match
        products = data["results"]
        matches = []
        
        # Simple matching algorithm (can be improved with NLP)
        query_terms = query.lower().split()
        
        for product in products:
            # Calculate a simple match score based on term frequency
            score = 0
            product_text = f"{product.get('name', '')} {product.get('description', '')} {product.get('category', '')}".lower()
            
            for term in query_terms:
                if term in product_text:
                    score += 1
            
            # Add to matches if there's any match at all
            if score > 0:
                # Extract only description and metadata
                processed_product = {
                    "description": product.get("description", ""),
                    "metadata": product.get("metadata", {})
                }
                
                matches.append({
                    "product": processed_product,
                    "match_score": score
                })
        
        # Sort matches by score (highest first)
        matches.sort(key=lambda x: x["match_score"], reverse=True)
        
        # Return the matches or an error if no match found
        if matches:
            return json.dumps({
                "matches": matches[:3],  # Return top 3 matches
                "total_matches": len(matches)
            }, indent=2)
        else:
            return json.dumps({
                "error": f"No products matching '{query}' were found."
            }, indent=2)
            
    except Exception as e:
        return json.dumps({"error": f"Error finding matching product: {str(e)}"}, indent=2)

if __name__ == "__main__":
    # Run the server with default settings (stdio transport)
    mcp.run()
