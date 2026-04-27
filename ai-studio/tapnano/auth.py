from flask import Blueprint, request, jsonify, session, redirect, url_for
from functools import wraps
import database

auth_bp = Blueprint('auth', __name__)

def login_required(f):
    @wraps(f)
    def decorated_function(*args, **kwargs):
        if 'user_id' not in session:
            if request.is_json:
                return jsonify({'error': '未登录', 'redirect': '/login'}), 401
            return redirect('/login')
        return f(*args, **kwargs)
    return decorated_function

def admin_required(f):
    @wraps(f)
    def decorated_function(*args, **kwargs):
        if 'user_id' not in session:
            if request.is_json:
                return jsonify({'error': '未登录', 'redirect': '/login'}), 401
            return redirect('/login')

        user = database.get_user_by_id(session['user_id'])
        if not user or user.get('role') != 'admin':
            if request.is_json:
                return jsonify({'error': '需要管理员权限'}), 403
            return redirect('/')

        return f(*args, **kwargs)
    return decorated_function

@auth_bp.route('/login', methods=['GET', 'POST'])
def login():
    if request.method == 'GET':
        from flask import render_template
        return render_template('login.html')

    data = request.get_json() or request.form
    username = data.get('username', '').strip()
    password = data.get('password', '')

    if not username or not password:
        if request.is_json:
            return jsonify({'error': '用户名和密码不能为空'}), 400
        return jsonify({'error': '用户名和密码不能为空'}), 400

    user = database.verify_user(username, password)

    if not user:
        if request.is_json:
            return jsonify({'error': '用户名或密码错误'}), 401
        return jsonify({'error': '用户名或密码错误'}), 401

    session['user_id'] = user['id']
    session['username'] = user['username']
    session['role'] = user['role']

    if request.is_json:
        return jsonify({'success': True, 'redirect': '/'})

    return redirect('/')

@auth_bp.route('/logout')
def logout():
    session.clear()
    return redirect('/login')

@auth_bp.route('/api/auth_status')
def auth_status():
    if 'user_id' in session:
        user = database.get_user_by_id(session['user_id'])
        if user:
            return jsonify({
                'authenticated': True,
                'user': {
                    'id': user['id'],
                    'username': user['username'],
                    'role': user['role']
                }
            })

    return jsonify({'authenticated': False})

@auth_bp.route('/api/users', methods=['GET'])
@admin_required
def list_users():
    users = database.get_all_users()
    for u in users:
        u.pop('password_hash', None)
    return jsonify(users)

@auth_bp.route('/api/users', methods=['POST'])
@admin_required
def create_user():
    data = request.get_json()
    username = data.get('username', '').strip()
    password = data.get('password', '')
    role = data.get('role', 'user')

    if not username or not password:
        return jsonify({'error': '用户名和密码不能为空'}), 400

    if len(password) < 6:
        return jsonify({'error': '密码至少6个字符'}), 400

    if role not in ['admin', 'user']:
        role = 'user'

    user_id, error = database.create_user(username, password, role)

    if error:
        return jsonify({'error': error}), 400

    return jsonify({'success': True, 'user_id': user_id})

@auth_bp.route('/api/users/<user_id>', methods=['DELETE'])
@admin_required
def delete_user(user_id):
    success, error = database.delete_user(user_id)

    if not success:
        return jsonify({'error': error or '删除失败'}), 400

    return jsonify({'success': True})

@auth_bp.route('/api/config/<key>', methods=['GET'])
@admin_required
def get_config(key):
    value = database.get_config(key)
    if value is None:
        return jsonify({'error': '配置不存在'}), 404
    return jsonify({'key': key, 'value': value})

@auth_bp.route('/api/config/<key>', methods=['PUT'])
@admin_required
def set_config(key):
    data = request.get_json()
    value = data.get('value', '')
    if not value:
        return jsonify({'error': '值不能为空'}), 400
    database.update_config(key, value)
    return jsonify({'success': True})

@auth_bp.route('/api/api_keys', methods=['GET'])
@admin_required
def list_api_keys():
    keys = database.get_api_keys()
    return jsonify(keys)

@auth_bp.route('/api/api_keys', methods=['POST'])
@admin_required
def create_api_key():
    data = request.get_json()
    name = data.get('name', '').strip()
    value = data.get('value', '').strip()

    if not value:
        return jsonify({'error': 'API KEY不能为空'}), 400

    key_id = database.add_api_key(name, value)
    return jsonify({'success': True, 'id': key_id})

@auth_bp.route('/api/api_keys/<key_id>/activate', methods=['POST'])
@admin_required
def activate_api_key(key_id):
    database.activate_api_key(key_id)
    return jsonify({'success': True})

@auth_bp.route('/api/api_keys/<key_id>', methods=['DELETE'])
@admin_required
def delete_api_key(key_id):
    database.delete_api_key(key_id)
    return jsonify({'success': True})