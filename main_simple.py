import os
import sys
# DON'T CHANGE THIS !!!
sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))

from flask import Flask, send_from_directory, jsonify
from flask_cors import CORS

app = Flask(__name__, static_folder=os.path.join(os.path.dirname(__file__), 'static'))
app.config['SECRET_KEY'] = 'sage_empire_mystical_secret_key_2024'

# Enable CORS for all routes
CORS(app, supports_credentials=True)

# Simple API endpoints for testing
@app.route('/api/health')
def health_check():
    return {'status': 'healthy', 'message': 'Sage Empire API is running'}, 200

@app.route('/api/auth/me')
def get_current_user():
    return {'success': False, 'message': 'Not authenticated'}, 401

@app.route('/api/shop/categories')
def get_categories():
    return {
        'success': True,
        'categories': [
            {'id': 1, 'name': 'Apparel', 'icon': 'fas fa-tshirt'},
            {'id': 2, 'name': 'Digital', 'icon': 'fas fa-download'},
            {'id': 3, 'name': 'Crystals', 'icon': 'fas fa-gem'},
            {'id': 4, 'name': 'Courses', 'icon': 'fas fa-graduation-cap'}
        ]
    }

@app.route('/api/shop/products')
def get_products():
    return {
        'success': True,
        'products': [
            {
                'id': 1,
                'name': 'Mystical Sage T-Shirt',
                'description': 'Premium cotton t-shirt with sacred geometry design',
                'price': 29.99,
                'category': 'Apparel',
                'required_tier': 'free',
                'image_url': '/assets/products/placeholder.jpg'
            }
        ],
        'has_next': False
    }

@app.route('/api/posts')
def get_posts():
    return {
        'success': True,
        'posts': [
            {
                'id': 1,
                'content': 'Welcome to the Sage Empire! Share your wisdom and connect with fellow seekers.',
                'author': {
                    'username': 'sage_master',
                    'display_name': 'The Sage Master',
                    'avatar_url': '/assets/icons/default-avatar.png'
                },
                'required_tier': 'free',
                'like_count': 42,
                'comment_count': 8,
                'share_count': 5,
                'user_liked': False,
                'created_at': '2024-07-15T20:00:00Z'
            }
        ],
        'has_next': False
    }

@app.route('/', defaults={'path': ''})
@app.route('/<path:path>')
def serve(path):
    static_folder_path = app.static_folder
    if static_folder_path is None:
        return "Static folder not configured", 404

    if path != "" and os.path.exists(os.path.join(static_folder_path, path)):
        return send_from_directory(static_folder_path, path)
    else:
        index_path = os.path.join(static_folder_path, 'index.html')
        if os.path.exists(index_path):
            return send_from_directory(static_folder_path, 'index.html')
        else:
            return "index.html not found", 404

if __name__ == '__main__':
    import os
    port = int(os.environ.get('PORT', 8080))
    app.run(host='0.0.0.0', port=port, debug=False)

