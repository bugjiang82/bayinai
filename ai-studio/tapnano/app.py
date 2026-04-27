import os
import io
import json
import mimetypes
import uuid
import base64
import requests
import urllib3
from datetime import datetime
from PIL import Image
from flask import Flask, render_template, request, jsonify, send_from_directory, session, redirect
from google import genai
from google.genai import types
from dotenv import load_dotenv
import database
import auth

urllib3.disable_warnings(urllib3.exceptions.InsecureRequestWarning)

SUPPORTED_IMAGE_FORMATS = {'image/jpeg', 'image/jpg', 'image/png', 'image/webp'}
MAX_IMAGE_SIZE = 10 * 1024 * 1024
MAX_IMAGE_PIXELS = 4096 * 4096

def validate_and_normalize_image(file):
    """验证并标准化图片格式"""
    filename = file.filename.lower()

    if filename.endswith('.png'):
        mime_type = 'image/png'
    elif filename.endswith('.jpg') or filename.endswith('.jpeg'):
        mime_type = 'image/jpeg'
    elif filename.endswith('.webp'):
        mime_type = 'image/webp'
    else:
        return None, None, '不支持的图片格式，仅支持 PNG、JPG、JPEG、WEBP'

    image_bytes = file.read()

    if len(image_bytes) > MAX_IMAGE_SIZE:
        return None, None, f'图片文件过大，最大支持 {MAX_IMAGE_SIZE // 1024 // 1024}MB'

    try:
        img = Image.open(io.BytesIO(image_bytes))

        if img.mode not in ('RGB', 'RGBA', 'L'):
            img = img.convert('RGB')

        if img.width > MAX_IMAGE_PIXELS ** 0.5 or img.height > MAX_IMAGE_PIXELS ** 0.5:
            ratio = min(MAX_IMAGE_PIXELS ** 0.5 / img.width, MAX_IMAGE_PIXELS ** 0.5 / img.height)
            new_size = (int(img.width * ratio), int(img.height * ratio))
            img = img.resize(new_size, Image.LANCZOS)

        output = io.BytesIO()
        if mime_type == 'image/png':
            img.save(output, format='PNG', optimize=True)
        elif mime_type == 'image/webp':
            img.save(output, format='WEBP', quality=85)
        else:
            img.save(output, format='JPEG', quality=85, optimize=True)
        normalized_bytes = output.getvalue()

        if mime_type in ('image/png', 'image/webp') and img.mode == 'RGBA':
            pass
        elif mime_type in ('image/jpeg', 'image/jpg') and img.mode == 'RGBA':
            img = img.convert('RGB')
            output = io.BytesIO()
            img.save(output, format='JPEG', quality=85, optimize=True)
            normalized_bytes = output.getvalue()
            mime_type = 'image/jpeg'

        return normalized_bytes, mime_type, None

    except Exception as e:
        return None, None, f'图片处理失败: {str(e)}'

load_dotenv()

OPENROUTER_API_KEY = os.environ.get('OPENROUTER_API_KEY', '')
OPENROUTER_API_URL = 'https://api.moonshot.cn/v1/chat/completions'
OPENROUTER_MODEL = 'kimi-k2.5'

KIMI_API_KEY = os.environ.get('KIMI_API_KEY', '')
KIMI_API_URL = 'https://api.moonshot.cn/v1/chat/completions'
KIMI_MODEL = 'kimi-k2.5'

DASHSCOPE_API_KEY = os.environ.get('DASHSCOPE_API_KEY', '')
DASHSCOPE_REGION = os.environ.get('DASHSCOPE_REGION', 'beijing')
DASHSCOPE_API_URL_BJ_I2V = 'https://dashscope.aliyuncs.com/api/v1/services/aigc/image2video/video-synthesis'
DASHSCOPE_API_URL_SG_I2V = 'https://dashscope-intl.aliyuncs.com/api/v1/services/aigc/image2video/video-synthesis'
DASHSCOPE_API_URL_BJ_T2V = 'https://dashscope.aliyuncs.com/api/v1/services/aigc/video-generation/video-synthesis'
DASHSCOPE_API_URL_SG_T2V = 'https://dashscope-intl.aliyuncs.com/api/v1/services/aigc/video-generation/video-synthesis'
WANX_MODEL = 'wan2.2-kf2v-flash'

def get_dashscope_url(model='wan2.2-kf2v-flash'):
    if DASHSCOPE_REGION == 'singapore':
        if 'wan2.7' in model:
            return 'https://dashscope-intl.aliyuncs.com/api/v1/services/aigc/video-generation/video-synthesis'
        return 'https://dashscope-intl.aliyuncs.com/api/v1/services/aigc/image2video/video-synthesis'
    else:
        if 'wan2.7' in model:
            return 'https://dashscope.aliyuncs.com/api/v1/services/aigc/video-generation/video-synthesis'
        return 'https://dashscope.aliyuncs.com/api/v1/services/aigc/image2video/video-synthesis'

def get_dashscope_task_url():
    if DASHSCOPE_REGION == 'singapore':
        return 'https://dashscope-intl.aliyuncs.com/api/v1/tasks'
    return 'https://dashscope.aliyuncs.com/api/v1/tasks'

OPENROUTER_SYSTEM_PROMPT = """你是一位专业建筑设计师，擅长使用AI渲染图片。你的任务是将用户输入的简单建筑描述优化成专业、详细的AI图片生成提示词。

优化原则：
1. 添加专业的建筑术语和渲染参数
2. 补充光线、材质、氛围等细节描述
3. 确保提示词适合AI图片生成模型理解
4. 输出纯文本提示词，不要添加任何解释或格式

直接输出优化后的提示词，不要其他内容。"""

app = Flask(__name__)
app.secret_key = os.environ.get('SECRET_KEY', os.urandom(24).hex())

app.register_blueprint(auth.auth_bp)

DATA_FOLDER = os.path.join(os.path.dirname(__file__), 'data')
os.makedirs(DATA_FOLDER, exist_ok=True)

def get_user_data_folder(user_id):
    folder = os.path.join(DATA_FOLDER, user_id, 'images')
    os.makedirs(folder, exist_ok=True)
    return folder

@app.route('/')
@auth.login_required
def index():
    return render_template('index.html')

@app.route('/upload')
@auth.login_required
def upload_page():
    return render_template('upload.html')

@app.route('/edit')
@auth.login_required
def edit_page():
    return render_template('edit.html')

@app.route('/batch')
@auth.login_required
def batch_page():
    return render_template('batch.html')

@app.route('/test')
@auth.login_required
def test_page():
    return render_template('test.html')

@app.route('/admin')
@auth.admin_required
def admin_page():
    return render_template('admin.html')

@app.route('/video-create')
@auth.login_required
def video_create_page():
    return render_template('video_create.html')

@app.route('/agent')
@auth.login_required
def agent_page():
    return render_template('agent.html')

@app.route('/api/config')
@auth.login_required
def get_api_config():
    return jsonify({
        'success': True,
        'config': {
            'kimiApiKey': KIMI_API_KEY or DASHSCOPE_API_KEY,
            'geminiApiKey': os.environ.get('GOOGLE_API_KEY', '')
        }
    })

@app.route('/api/kimi/chat', methods=['POST'])
@auth.login_required
def kimi_chat():
    data = request.get_json()
    if not data:
        return jsonify({'error': 'Invalid request body'}), 400

    messages = data.get('messages', [])
    model = data.get('model', KIMI_MODEL)
    temperature = data.get('temperature', 1)
    max_tokens = data.get('max_tokens', 4096)

    api_key = KIMI_API_KEY or DASHSCOPE_API_KEY
    if not api_key:
        return jsonify({'error': 'Kimi API Key 未配置'}), 500

    try:
        headers = {
            'Content-Type': 'application/json',
            'Authorization': f'Bearer {api_key}'
        }

        payload = {
            'model': model,
            'messages': messages,
            'temperature': temperature,
            'max_tokens': max_tokens
        }

        response = requests.post(KIMI_API_URL, headers=headers, json=payload, timeout=60)

        if not response.ok:
            try:
                error_data = response.json()
                error_msg = error_data.get('error', {}).get('message') or f'HTTP {response.status}'
            except:
                error_msg = f'HTTP {response.status}'
            return jsonify({'error': error_msg}), response.status_code

        return response.json(), 200

    except requests.exceptions.Timeout:
        return jsonify({'error': '请求超时'}), 500
    except Exception as e:
        app.logger.error(f"Kimi API error: {str(e)}")
        return jsonify({'error': str(e)}), 500

def get_user_video_folder(user_id):
    folder = os.path.join(DATA_FOLDER, user_id, 'videos')
    os.makedirs(folder, exist_ok=True)
    return folder

@app.route('/api/video/generate', methods=['POST'])
@auth.login_required
def generate_video():
    data = request.get_json()
    if not data:
        return jsonify({'error': 'Invalid request body'}), 400

    first_frame = data.get('first_frame', '').strip()
    last_frame = data.get('last_frame', '').strip()
    prompt = data.get('prompt', '').strip()
    resolution = data.get('resolution', '720P')
    duration = data.get('duration', 5)
    prompt_extend = data.get('prompt_extend', False)
    model = data.get('model', WANX_MODEL)

    if not first_frame or not last_frame:
        return jsonify({'error': '请上传起始帧和结束帧'}), 400

    if not DASHSCOPE_API_KEY:
        return jsonify({'error': '视频生成服务未配置API Key'}), 500

    user_id = session.get('user_id')

    try:
        import imghdr

        first_frame_data = None
        last_frame_data = None

        if first_frame.startswith('data:image'):
            first_frame_data = base64.b64decode(first_frame.split(',')[1])
        else:
            return jsonify({'error': '无效的起始帧数据'}), 400

        if last_frame.startswith('data:image'):
            last_frame_data = base64.b64decode(last_frame.split(',')[1])
        else:
            return jsonify({'error': '无效的结束帧数据'}), 400

        max_size = 6 * 1024 * 1024
        if len(first_frame_data) > max_size or len(last_frame_data) > max_size:
            from PIL import Image
            import io

            def compress_image(data, max_size_bytes=6*1024*1024):
                img = Image.open(io.BytesIO(data))
                if img.mode in ('RGBA', 'P'):
                    img = img.convert('RGB')
                quality = 95
                output = io.BytesIO()
                while quality > 30:
                    output.seek(0)
                    output.truncate()
                    img.save(output, format='JPEG', quality=quality, optimize=True)
                    if output.tell() <= max_size_bytes:
                        break
                    quality -= 5
                return output.getvalue()

            if len(first_frame_data) > max_size:
                first_frame_data = compress_image(first_frame_data)
            if len(last_frame_data) > max_size:
                last_frame_data = compress_image(last_frame_data)

        first_filename = f"first_{uuid.uuid4().hex}.jpg"
        last_filename = f"last_{uuid.uuid4().hex}.jpg"
        video_folder = get_user_video_folder(user_id)

        first_filepath = os.path.join(video_folder, first_filename)
        last_filepath = os.path.join(video_folder, last_filename)

        with open(first_filepath, 'wb') as f:
            f.write(first_frame_data)

        with open(last_filepath, 'wb') as f:
            f.write(last_frame_data)

        first_base64 = base64.b64encode(first_frame_data).decode('utf-8')
        last_base64 = base64.b64encode(last_frame_data).decode('utf-8')

        first_data_url = f"data:image/jpeg;base64,{first_base64}"
        last_data_url = f"data:image/jpeg;base64,{last_base64}"

        headers = {
            'Content-Type': 'application/json',
            'Authorization': f'Bearer {DASHSCOPE_API_KEY}',
            'X-DashScope-Async': 'enable'
        }

        if 'wan2.7' in model:
            payload = {
                'model': model,
                'input': {
                    'prompt': prompt,
                    'media': [
                        {'type': 'first_frame', 'url': first_data_url},
                        {'type': 'last_frame', 'url': last_data_url}
                    ]
                },
                'parameters': {
                    'resolution': resolution,
                    'duration': duration,
                    'prompt_extend': prompt_extend,
                    'watermark': False
                }
            }
        else:
            payload = {
                'model': model,
                'input': {
                    'first_frame_url': first_data_url,
                    'last_frame_url': last_data_url,
                    'prompt': prompt
                },
                'parameters': {
                    'resolution': resolution,
                    'duration': duration,
                    'prompt_extend': prompt_extend,
                    'watermark': False
                }
            }

        payload_json = json.dumps(payload)

        import subprocess
        import tempfile

        try:
            with tempfile.NamedTemporaryFile(mode='w', suffix='.json', delete=False) as f:
                json.dump(payload, f)
                json_file = f.name

            curl_cmd = [
                'curl', '-s', '-X', 'POST',
                get_dashscope_url(model),
                '-H', f'Authorization: Bearer {DASHSCOPE_API_KEY}',
                '-H', 'Content-Type: application/json',
                '-H', 'X-DashScope-Async: enable',
                '-d', f'@{json_file}',
                '--max-time', '120'
            ]

            result = subprocess.run(curl_cmd, capture_output=True, text=True, timeout=130)

            os.unlink(json_file)

            if result.returncode != 0:
                app.logger.error(f"Curl failed: {result.stderr}")
                if os.path.exists(first_filepath):
                    os.remove(first_filepath)
                if os.path.exists(last_filepath):
                    os.remove(last_filepath)
                return jsonify({'error': f'视频生成服务连接失败: {result.stderr[:200]}'}), 500

            response_text = result.stdout
            result_data = json.loads(response_text)

        except subprocess.TimeoutExpired:
            app.logger.error("Curl timeout")
            if os.path.exists(first_filepath):
                os.remove(first_filepath)
            if os.path.exists(last_filepath):
                os.remove(last_filepath)
            return jsonify({'error': '视频生成服务请求超时'}), 500
        except json.JSONDecodeError as e:
            app.logger.error(f"Invalid JSON response: {result.stdout[:500]}")
            if os.path.exists(first_filepath):
                os.remove(first_filepath)
            if os.path.exists(last_filepath):
                os.remove(last_filepath)
            return jsonify({'error': f'视频生成服务响应格式错误'}), 500
        except Exception as e:
            app.logger.error(f"Curl error: {str(e)}")
            if os.path.exists(first_filepath):
                os.remove(first_filepath)
            if os.path.exists(last_filepath):
                os.remove(last_filepath)
            return jsonify({'error': f'视频生成服务连接失败: {str(e)}'}), 500

        if not result_data.get('output'):
            error_msg = result_data.get('error', {}).get('message', result_data.get('message', '未知错误'))
            code = result_data.get('code', '')
            app.logger.error(f"DashScope API error: {code} - {error_msg}")
            if os.path.exists(first_filepath):
                os.remove(first_filepath)
            if os.path.exists(last_filepath):
                os.remove(last_filepath)
            return jsonify({'error': f'视频生成失败: {error_msg}'}), 500

        if os.path.exists(first_filepath):
            os.remove(first_filepath)
        if os.path.exists(last_filepath):
            os.remove(last_filepath)

        app.logger.error(f"DashScope response: {result_data}")

        if 'output' in result_data and 'task_id' in result_data.get('output', {}):
            task_id = result_data['output']['task_id']

            video_id = database.add_video(
                user_id=user_id,
                filename='',
                prompt=prompt,
                duration=duration,
                model=model,
                task_id=task_id
            )

            return jsonify({
                'success': True,
                'task_id': task_id,
                'video_id': video_id,
                'message': '视频生成任务已提交'
            })
        else:
            error_msg = result_data.get('message', '未知错误')
            if 'error' in result_data:
                error_msg = result_data['error'].get('message', error_msg)
            if 'code' in result_data:
                error_msg = f"{result_data.get('code', '')}: {error_msg}"
            app.logger.error(f"Video generation failed: {error_msg}, full response: {result_data}")
            return jsonify({'error': f'视频生成失败: {error_msg}'}), 500

    except subprocess.TimeoutExpired:
        return jsonify({'error': '视频生成请求超时，请重试'}), 500
    except Exception as e:
        app.logger.error(f"Video generation error: {str(e)}")
        return jsonify({'error': f'视频生成失败: {str(e)}'}), 500

@app.route('/api/video/status/<task_id>', methods=['GET'])
@auth.login_required
def get_video_status(task_id):
    if not DASHSCOPE_API_KEY:
        return jsonify({'error': '视频生成服务未配置API Key'}), 500

    try:
        video = database.get_video_by_task_id(task_id)
        if not video:
            return jsonify({'error': '视频任务不存在'}), 404

        user_id = session.get('user_id')
        if video['user_id'] != user_id:
            return jsonify({'error': '无权限访问'}), 403

        headers = {
            'Authorization': f'Bearer {DASHSCOPE_API_KEY}'
        }

        status_url = f'{get_dashscope_task_url()}/{task_id}'

        try:
            response = requests.get(status_url, headers=headers, timeout=30, verify=False)
        except (requests.exceptions.SSLError, requests.exceptions.ConnectionError) as e:
            app.logger.error(f"Status check connection error: {str(e)}")
            try:
                response = requests.get(status_url, headers=headers, timeout=30)
            except Exception as retry_error:
                app.logger.error(f"Status check retry failed: {str(retry_error)}")
                return jsonify({'error': f'查询连接失败: {str(retry_error)}'}), 500

        result = response.json()

        status = 'processing'
        progress = 50
        video_url = None
        message = ''

        task_status = result.get('output', {}).get('task_status', '')

        if task_status == 'SUCCEEDED':
            status = 'completed'
            progress = 100
            video_url = result.get('output', {}).get('video_url', '')
            message = '视频生成完成'

            database.update_video_status(video['id'], 'completed', video_url)

            if video_url:
                try:
                    video_response = requests.get(video_url, timeout=120)
                    if video_response.ok:
                        video_filename = f"{uuid.uuid4().hex}.mp4"
                        video_filepath = os.path.join(get_user_video_folder(user_id), video_filename)

                        with open(video_filepath, 'wb') as f:
                            f.write(video_response.content)

                        video['filename'] = video_filename

                        from database import get_db
                        conn = get_db()
                        cursor = conn.cursor()
                        cursor.execute(
                            "UPDATE videos SET filename = ?, status = ?, thumbnail_url = ? WHERE id = ?",
                            (video_filename, 'completed', video_url, video['id'])
                        )
                        conn.commit()
                        conn.close()

                        video_url = f'/data/{user_id}/videos/{video_filename}'
                except Exception as download_error:
                    app.logger.error(f"Failed to download video: {download_error}")
                    video_url = result.get('output', {}).get('video_url', '')

        elif task_status == 'FAILED':
            status = 'failed'
            message = result.get('output', {}).get('message', '视频生成失败')
            database.update_video_status(video['id'], 'failed')
        elif task_status == 'PENDING':
            status = 'processing'
            progress = 20
            message = '任务排队中...'
        elif task_status == 'RUNNING':
            status = 'processing'
            progress = 50
            message = '视频生成中...'
        else:
            status = 'processing'
            progress = 30
            message = '等待处理...'

        return jsonify({
            'success': True,
            'status': status,
            'progress': progress,
            'video_url': video_url,
            'message': message
        })

    except Exception as e:
        app.logger.error(f"Video status error: {str(e)}")
        return jsonify({'error': f'查询失败: {str(e)}'}), 500

@app.route('/api/video/history', methods=['GET'])
@auth.login_required
def get_video_history():
    user_id = session.get('user_id')
    videos = database.get_user_videos(user_id)

    for video in videos:
        if video['filename']:
            video['video_url'] = f'/data/{user_id}/videos/{video["filename"]}'
        else:
            video['video_url'] = video.get('thumbnail_url', '')

    return jsonify({
        'success': True,
        'videos': videos
    })

@app.route('/data/<user_id>/videos/<filename>')
@auth.login_required
def serve_user_video(user_id, filename):
    if session.get('user_id') != user_id:
        return jsonify({'error': '无权限访问'}), 403

    folder = os.path.join(DATA_FOLDER, user_id, 'videos')
    return send_from_directory(folder, filename)

@app.route('/generate', methods=['POST'])
@auth.login_required
def generate():
    data = request.get_json()
    if not data:
        return jsonify({'error': 'Invalid request body'}), 400

    prompt = data.get('prompt', '').strip()
    aspect_ratio = data.get('aspect_ratio', '1:1')
    image_size = data.get('image_size', '1K')
    thinking_level = data.get('thinking_level', 'MINIMAL')
    model = data.get('model', 'gemini-3.1-flash-image-preview')

    if not prompt:
        return jsonify({'error': '描述不能为空'}), 400

    api_key = database.get_active_api_key()
    if not api_key:
        return jsonify({'error': 'API密钥未配置'}), 500

    user_id = session.get('user_id')

    try:
        client = genai.Client(api_key=api_key)

        contents = [
            types.Content(
                role="user",
                parts=[
                    types.Part.from_text(text=prompt),
                ],
            ),
        ]

        is_pro_model = 'pro' in model.lower()
        generate_content_config = types.GenerateContentConfig(
            thinking_config=None if is_pro_model else types.ThinkingConfig(
                thinking_level=thinking_level,
            ),
            image_config=types.ImageConfig(
                aspect_ratio=aspect_ratio,
                image_size=image_size,
            ),
            response_modalities=[
                "IMAGE",
                "TEXT",
            ],
        )

        image_data = None
        imageMime = None

        for chunk in client.models.generate_content_stream(
            model=model,
            contents=contents,
            config=generate_content_config,
        ):
            if chunk.parts:
                for part in chunk.parts:
                    if part.inline_data and part.inline_data.data:
                        image_data = part.inline_data.data
                        imageMime = part.inline_data.mime_type

        if not image_data:
            return jsonify({'error': '未生成图片'}), 500

        file_extension = mimetypes.guess_extension(imageMime) or '.png'
        filename = f"{uuid.uuid4().hex}{file_extension}"
        filepath = os.path.join(get_user_data_folder(user_id), filename)

        with open(filepath, 'wb') as f:
            f.write(image_data)

        database.add_image(
            user_id=user_id,
            filename=filename,
            prompt=prompt,
            aspect_ratio=aspect_ratio,
            image_size=image_size,
            thinking_level=thinking_level,
            model=model
        )

        return jsonify({
            'success': True,
            'filename': filename,
            'image_id': None
        })

    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/generate_from_image', methods=['POST'])
@auth.login_required
def generate_from_image():
    files = request.files.getlist('images')
    if not files or len(files) == 0 or files[0].filename == '':
        return jsonify({'error': '没有上传图片'}), 400

    prompt = request.form.get('prompt', '').strip()
    aspect_ratio = request.form.get('aspect_ratio', '1:1')
    image_size = request.form.get('image_size', '1K')
    thinking_level = request.form.get('thinking_level', 'MINIMAL')
    model = request.form.get('model', 'gemini-3.1-flash-image-preview')

    if not prompt:
        return jsonify({'error': '描述不能为空'}), 400

    api_key = database.get_active_api_key()
    if not api_key:
        return jsonify({'error': 'API密钥未配置'}), 500

    user_id = session.get('user_id')

    try:
        client = genai.Client(api_key=api_key)

        is_pro_model = 'pro' in model.lower()
        parts = []
        for i, file in enumerate(files):
            normalized_bytes, mime_type, error = validate_and_normalize_image(file)
            if error:
                return jsonify({'error': f'第{i+1}张图片: {error}'}), 400
            parts.append(types.Part.from_bytes(data=normalized_bytes, mime_type=mime_type))
        parts.append(types.Part.from_text(text=prompt))

        contents = [
            types.Content(
                role="user",
                parts=parts,
            ),
        ]

        generate_content_config = types.GenerateContentConfig(
            thinking_config=None if is_pro_model else types.ThinkingConfig(
                thinking_level=thinking_level,
            ),
            image_config=types.ImageConfig(
                aspect_ratio=aspect_ratio,
                image_size=image_size,
            ),
            response_modalities=[
                "IMAGE",
                "TEXT",
            ],
        )

        image_data = None
        imageMime = None

        for chunk in client.models.generate_content_stream(
            model=model,
            contents=contents,
            config=generate_content_config,
        ):
            if chunk.parts:
                for part in chunk.parts:
                    if part.inline_data and part.inline_data.data:
                        image_data = part.inline_data.data
                        imageMime = part.inline_data.mime_type

        if not image_data:
            return jsonify({'error': '未生成图片'}), 500

        file_extension = mimetypes.guess_extension(imageMime) or '.png'
        filename = f"{uuid.uuid4().hex}{file_extension}"
        filepath = os.path.join(get_user_data_folder(user_id), filename)

        with open(filepath, 'wb') as f:
            f.write(image_data)

        database.add_image(
            user_id=user_id,
            filename=filename,
            prompt=prompt,
            aspect_ratio=aspect_ratio,
            image_size=image_size,
            thinking_level=thinking_level,
            model=model
        )

        return jsonify({
            'success': True,
            'filename': filename
        })

    except Exception as e:
        error_msg = str(e)
        if 'Unable to process input image' in error_msg:
            return jsonify({'error': '参考图片无法处理，请尝试其他图片格式或更小的文件'}), 500
        return jsonify({'error': error_msg}), 500

@app.route('/edit_image', methods=['POST'])
@auth.login_required
def edit_image():
    data = request.get_json()
    if not data:
        return jsonify({'error': 'Invalid request body'}), 400

    original_image_b64 = data.get('original_image', '').strip()
    mask_b64 = data.get('mask', '').strip()
    prompt = data.get('prompt', '').strip()
    original_filename = data.get('filename', 'unknown')

    if not original_image_b64 or not mask_b64:
        return jsonify({'error': '图片或蒙版不能为空'}), 400

    if not prompt:
        return jsonify({'error': '修改描述不能为空'}), 400

    api_key = database.get_active_api_key()
    if not api_key:
        return jsonify({'error': 'API密钥未配置'}), 500

    user_id = session.get('user_id')

    try:
        original_bytes = base64.b64decode(original_image_b64)
        mask_bytes = base64.b64decode(mask_b64)

        from PIL import Image
        import io

        original_img = Image.open(io.BytesIO(original_bytes)).convert('RGBA')
        mask_img = Image.open(io.BytesIO(mask_bytes)).convert('L')

        if original_img.size != mask_img.size:
            mask_img = mask_img.resize(original_img.size, Image.LANCZOS)

        white_bg = Image.new('RGBA', original_img.size, (255, 255, 255, 255))
        original_img = Image.alpha_composite(white_bg, original_img).convert('RGB')

        composite = Image.new('RGB', original_img.size, (128, 128, 128))
        mask_array = list(mask_img.getdata())
        orig_array = list(original_img.getdata())

        for i in range(len(mask_array)):
            if mask_array[i] > 127:
                pixel = orig_array[i]
                composite.putpixel((i % original_img.width, i // original_img.width), pixel)

        output_buffer = io.BytesIO()
        composite.save(output_buffer, format='PNG')
        composite_bytes = output_buffer.getvalue()

        client = genai.Client(api_key=api_key)

        contents = [
            types.Content(
                role="user",
                parts=[
                    types.Part.from_bytes(data=composite_bytes, mime_type='image/png'),
                    types.Part.from_text(
                        text=f"这是一张编辑中的图片。白色/亮色区域是待修改区域，灰色区域保持不变。请根据以下描述修改白色区域的内容：{prompt}"
                    ),
                ],
            ),
        ]

        generate_content_config = types.GenerateContentConfig(
            thinking_config=None,
            response_modalities=[
                "IMAGE",
                "TEXT",
            ],
        )

        image_data = None
        imageMime = None

        for chunk in client.models.generate_content_stream(
            model=model,
            contents=contents,
            config=generate_content_config,
        ):
            if chunk.parts:
                for part in chunk.parts:
                    if part.inline_data and part.inline_data.data:
                        image_data = part.inline_data.data
                        imageMime = part.inline_data.mime_type

        if not image_data:
            return jsonify({'error': '编辑失败，未生成图片'}), 500

        file_extension = mimetypes.guess_extension(imageMime) or '.png'
        filename = f"{uuid.uuid4().hex}{file_extension}"
        filepath = os.path.join(get_user_data_folder(user_id), filename)

        with open(filepath, 'wb') as f:
            f.write(image_data)

        database.add_image(
            user_id=user_id,
            filename=filename,
            prompt=f"[编辑] {prompt}",
            aspect_ratio='1:1',
            image_size='original',
            thinking_level='MINIMAL',
            model=model,
            source_filename=original_filename
        )

        return jsonify({
            'success': True,
            'filename': filename
        })

    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/regenerate', methods=['POST'])
@auth.login_required
def regenerate():
    data = request.get_json()
    if not data:
        return jsonify({'error': 'Invalid request body'}), 400

    prompt = data.get('prompt', '').strip()
    image_id = data.get('image_id', '').strip()
    aspect_ratio = data.get('aspect_ratio', '1:1')
    image_size = data.get('image_size', '1K')
    thinking_level = data.get('thinking_level', 'MINIMAL')
    model = data.get('model', 'gemini-3.1-flash-image-preview')

    if not prompt:
        return jsonify({'error': '描述不能为空'}), 400

    api_key = database.get_active_api_key()
    if not api_key:
        return jsonify({'error': 'API密钥未配置'}), 500

    user_id = session.get('user_id')

    try:
        client = genai.Client(api_key=api_key)

        is_pro_model = 'pro' in model.lower()
        contents = [
            types.Content(
                role="user",
                parts=[
                    types.Part.from_text(text=prompt),
                ],
            ),
        ]

        generate_content_config = types.GenerateContentConfig(
            thinking_config=None if is_pro_model else types.ThinkingConfig(
                thinking_level=thinking_level,
            ),
            image_config=types.ImageConfig(
                aspect_ratio=aspect_ratio,
                image_size=image_size,
            ),
            response_modalities=[
                "IMAGE",
                "TEXT",
            ],
        )

        image_data = None
        imageMime = None

        for chunk in client.models.generate_content_stream(
            model=model,
            contents=contents,
            config=generate_content_config,
        ):
            if chunk.parts:
                for part in chunk.parts:
                    if part.inline_data and part.inline_data.data:
                        image_data = part.inline_data.data
                        imageMime = part.inline_data.mime_type

        if not image_data:
            return jsonify({'error': '未生成图片'}), 500

        file_extension = mimetypes.guess_extension(imageMime) or '.png'
        filename = f"{uuid.uuid4().hex}{file_extension}"
        filepath = os.path.join(get_user_data_folder(user_id), filename)

        with open(filepath, 'wb') as f:
            f.write(image_data)

        if image_id:
            database.update_image_prompt(image_id, user_id, prompt)

        database.add_image(
            user_id=user_id,
            filename=filename,
            prompt=prompt,
            aspect_ratio=aspect_ratio,
            image_size=image_size,
            thinking_level=thinking_level,
            model=model
        )

        return jsonify({
            'success': True,
            'filename': filename
        })

    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/history', methods=['GET'])
@auth.login_required
def get_history():
    user_id = session.get('user_id')
    images = database.get_user_images(user_id)
    return jsonify(images)

@app.route('/api/image/<image_id>', methods=['DELETE'])
@auth.login_required
def delete_image_api(image_id):
    user_id = session.get('user_id')
    try:
        success = database.delete_image(image_id, user_id)
        if success:
            return jsonify({'success': True, 'message': '删除成功'})
        else:
            return jsonify({'error': '记录不存在或无权限删除'}), 404
    except Exception as e:
        app.logger.error(f"Delete image error: {str(e)}")
        return jsonify({'error': f'删除失败: {str(e)}'}), 500

@app.route('/api/images/batch-delete', methods=['POST'])
@auth.login_required
def batch_delete_images():
    user_id = session.get('user_id')
    data = request.get_json()
    if not data or 'image_ids' not in data:
        return jsonify({'error': '缺少image_ids参数'}), 400

    image_ids = data.get('image_ids', [])
    if not image_ids or not isinstance(image_ids, list):
        return jsonify({'error': 'image_ids必须是数组'}), 400

    deleted_count = 0
    failed_ids = []

    for image_id in image_ids:
        try:
            success = database.delete_image(image_id, user_id)
            if success:
                deleted_count += 1
            else:
                failed_ids.append(image_id)
        except Exception as e:
            failed_ids.append(image_id)
            app.logger.error(f"Batch delete image {image_id} error: {str(e)}")

    return jsonify({
        'success': True,
        'deleted_count': deleted_count,
        'failed_count': len(failed_ids),
        'failed_ids': failed_ids
    })

@app.route('/thumb/<user_id>/<filename>')
@auth.login_required
def serve_thumbnail(user_id, filename):
    if session.get('user_id') != user_id:
        return jsonify({'error': '无权限访问'}), 403

    folder = os.path.join(DATA_FOLDER, user_id, 'thumbnails')
    return send_from_directory(folder, filename)

@app.route('/data/<user_id>/images/<filename>')
@auth.login_required
def serve_user_image(user_id, filename):
    if session.get('user_id') != user_id:
        return jsonify({'error': '无权限访问'}), 403

    folder = os.path.join(DATA_FOLDER, user_id, 'images')
    return send_from_directory(folder, filename)

@app.route('/api/templates', methods=['GET'])
@auth.login_required
def get_templates():
    category = request.args.get('category', '全部')
    search = request.args.get('search', '')
    page = int(request.args.get('page', 1))
    limit = int(request.args.get('limit', 20))

    result = database.get_templates(category=category, search=search, page=page, limit=limit)
    return jsonify({'success': True, 'data': result})

@app.route('/api/templates/<int:template_id>', methods=['GET'])
@auth.login_required
def get_template(template_id):
    template = database.get_template_by_id(template_id)
    if not template:
        return jsonify({'success': False, 'error': '模板不存在'}), 404

    user_id = session.get('user_id')
    template['is_favorited'] = database.is_template_favorited(user_id, template_id)

    return jsonify({'success': True, 'data': template})

@app.route('/api/templates/categories', methods=['GET'])
@auth.login_required
def get_template_categories():
    categories = database.get_categories()
    return jsonify({'success': True, 'data': categories})

@app.route('/api/templates/favorites', methods=['GET'])
@auth.login_required
def get_template_favorites():
    user_id = session.get('user_id')
    favorites = database.get_user_favorites(user_id)
    return jsonify({'success': True, 'data': favorites})

@app.route('/api/templates/favorites', methods=['POST'])
@auth.login_required
def add_template_favorite():
    data = request.get_json()
    if not data or 'template_id' not in data:
        return jsonify({'success': False, 'error': '缺少template_id'}), 400

    user_id = session.get('user_id')
    success, error = database.add_template_favorite(user_id, data['template_id'])

    if success:
        return jsonify({'success': True, 'message': '收藏成功'})
    else:
        return jsonify({'success': False, 'error': error}), 400

@app.route('/api/templates/favorites', methods=['DELETE'])
@auth.login_required
def remove_template_favorite():
    data = request.get_json()
    if not data or 'template_id' not in data:
        return jsonify({'success': False, 'error': '缺少template_id'}), 400

    user_id = session.get('user_id')
    success = database.remove_template_favorite(user_id, data['template_id'])

    if success:
        return jsonify({'success': True, 'message': '取消收藏成功'})
    else:
        return jsonify({'success': False, 'error': '取消收藏失败'}), 400

@app.route('/api/templates/<int:template_id>/use', methods=['POST'])
@auth.login_required
def use_template(template_id):
    data = request.get_json() or {}
    task_id = data.get('task_id')

    template = database.get_template_by_id(template_id)
    if not template:
        return jsonify({'success': False, 'error': '模板不存在'}), 404

    user_id = session.get('user_id')
    database.increment_template_use_count(template_id)
    database.log_template_usage(user_id, template_id, task_id)

    return jsonify({'success': True, 'message': '使用成功'})

@app.route('/api/templates/admin', methods=['GET'])
@auth.admin_required
def get_all_templates_admin():
    templates = database.get_all_templates_admin()
    return jsonify({'success': True, 'data': templates})

@app.route('/api/templates/admin', methods=['POST'])
@auth.admin_required
def create_template():
    data = request.get_json()
    if not data:
        return jsonify({'success': False, 'error': '无效请求'}), 400

    required_fields = ['category', 'name', 'prompt_template']
    for field in required_fields:
        if field not in data:
            return jsonify({'success': False, 'error': f'缺少必填字段: {field}'}), 400

    template_id = database.create_template(
        category=data['category'],
        sub_category=data.get('sub_category'),
        name=data['name'],
        description=data.get('description', ''),
        prompt_template=data['prompt_template'],
        example_image=data.get('example_image'),
        original_image=data.get('original_image'),
        tags=data.get('tags'),
        is_featured=data.get('is_featured', False)
    )

    return jsonify({'success': True, 'message': '创建成功', 'template_id': template_id})

@app.route('/api/templates/admin/<int:template_id>', methods=['PUT'])
@auth.admin_required
def update_template_admin(template_id):
    data = request.get_json()
    if not data:
        return jsonify({'success': False, 'error': '无效请求'}), 400

    database.update_template(
        template_id=template_id,
        category=data.get('category'),
        sub_category=data.get('sub_category'),
        name=data.get('name'),
        description=data.get('description'),
        prompt_template=data.get('prompt_template'),
        example_image=data.get('example_image'),
        original_image=data.get('original_image'),
        tags=data.get('tags'),
        is_featured=data.get('is_featured')
    )

    return jsonify({'success': True, 'message': '更新成功'})

@app.route('/api/templates/admin/<int:template_id>', methods=['DELETE'])
@auth.admin_required
def delete_template_admin(template_id):
    database.delete_template(template_id)
    return jsonify({'success': True, 'message': '删除成功'})

@app.route('/template-images/<path:filename>')
@auth.login_required
def serve_template_image(filename):
    template_folder = os.path.join(os.path.dirname(__file__), 'data', 'templates')
    return send_from_directory(template_folder, filename)

@app.route('/api/optimize-prompt', methods=['POST'])
@auth.login_required
def optimize_prompt():
    if not OPENROUTER_API_KEY:
        return jsonify({'success': False, 'error': '优化服务未配置API Key'}), 500

    data = request.get_json()
    if not data:
        return jsonify({'success': False, 'error': 'Invalid request body'}), 400

    prompt = data.get('prompt', '').strip()
    if not prompt:
        return jsonify({'success': False, 'error': '请输入描述'}), 400

    try:
        headers = {
            'Content-Type': 'application/json',
            'Authorization': f'Bearer {OPENROUTER_API_KEY}'
        }

        payload = {
            'model': OPENROUTER_MODEL,
            'messages': [
                {'role': 'system', 'content': OPENROUTER_SYSTEM_PROMPT},
                {'role': 'user', 'content': prompt}
            ],
            'temperature': 1
        }

        response = requests.post(OPENROUTER_API_URL, headers=headers, json=payload, timeout=60)

        if not response.ok:
            error_detail = response.text
            app.logger.error(f"Kimi API error: {response.status_code} - {error_detail}")
            try:
                error_json = response.json()
                if 'error' in error_json:
                    error_message = error_json['error'].get('message', '未知错误')
                else:
                    error_message = error_json.get('error', '优化服务暂时不可用')
            except:
                error_message = f'优化服务暂时不可用 (错误码: {response.status_code})'
            return jsonify({'success': False, 'error': error_message}), 500

        result = response.json()

        if 'choices' not in result or len(result['choices']) == 0:
            return jsonify({'success': False, 'error': '优化失败，请重试'}), 500

        optimized_prompt = result['choices'][0]['message']['content'].strip()

        return jsonify({
            'success': True,
            'optimized_prompt': optimized_prompt
        })

    except requests.exceptions.Timeout:
        return jsonify({'success': False, 'error': '优化超时，请重试'}), 500
    except Exception as e:
        return jsonify({'success': False, 'error': f'优化失败: {str(e)}'}), 500

@app.route('/api/proxy/generate', methods=['POST'])
def proxy_generate():
    """
    代理转发接口：供内网其他服务器调用，转发到 Google Gemini API
    认证方式：使用 X-API-Key 头
    """
    api_key_header = request.headers.get('X-API-Key')

    if not api_key_header:
        return jsonify({'error': '缺少 X-API-Key 认证头'}), 401

    stored_key = database.get_active_api_key()
    if api_key_header != stored_key:
        return jsonify({'error': '无效的 API Key'}), 403

    data = request.get_json()
    if not data:
        return jsonify({'error': 'Invalid request body'}), 400

    prompt = data.get('prompt', '').strip()
    aspect_ratio = data.get('aspect_ratio', '1:1')
    image_size = data.get('image_size', '1K')
    thinking_level = data.get('thinking_level', 'MINIMAL')
    model = data.get('model', 'gemini-3.1-flash-image-preview')

    if not prompt:
        return jsonify({'error': '描述不能为空'}), 400

    try:
        client = genai.Client(api_key=stored_key)

        is_pro_model = 'pro' in model.lower()
        parts = [types.Part.from_text(text=prompt)]
        contents = [types.Content(role='user', parts=parts)]

        generate_content_config = types.GenerateContentConfig(
            thinking_config=None if is_pro_model else types.ThinkingConfig(
                thinking_level=thinking_level,
            ),
            image_config=types.ImageConfig(
                aspect_ratio=aspect_ratio,
                image_size=image_size,
            ),
            response_modalities=['IMAGE', 'TEXT'],
        )

        image_data = None
        image_mime = None

        for chunk in client.models.generate_content_stream(
            model=model,
            contents=contents,
            config=generate_content_config,
        ):
            if chunk.parts:
                for part in chunk.parts:
                    if part.inline_data and part.inline_data.data:
                        image_data = part.inline_data.data
                        image_mime = part.inline_data.mime_type

        if not image_data:
            return jsonify({'error': '未生成图片'}), 500

        import base64
        image_base64 = base64.b64encode(image_data).decode('utf-8')

        return jsonify({
            'success': True,
            'image_data': image_base64,
            'mime_type': image_mime,
            'model': model
        })

    except Exception as e:
        error_msg = str(e)
        if 'not found' in error_msg.lower() or '404' in error_msg:
            return jsonify({'error': f'模型 {model} 不存在'}), 400
        if 'quota' in error_msg.lower() or '429' in error_msg:
            return jsonify({'error': 'API 配额已用完'}), 429
        return jsonify({'error': error_msg}), 500

@app.route('/api/proxy/generate-image', methods=['POST'])
def proxy_generate_from_image():
    """
    代理转发接口：供内网其他服务器调用，参考图生成
    认证方式：使用 X-API-Key 头
    """
    api_key_header = request.headers.get('X-API-Key')

    if not api_key_header:
        return jsonify({'error': '缺少 X-API-Key 认证头'}), 401

    stored_key = database.get_active_api_key()
    if api_key_header != stored_key:
        return jsonify({'error': '无效的 API Key'}), 403

    files = request.files.getlist('images')
    prompt = request.form.get('prompt', '').strip()
    aspect_ratio = request.form.get('aspect_ratio', '1:1')
    image_size = request.form.get('image_size', '1K')
    thinking_level = request.form.get('thinking_level', 'MINIMAL')
    model = request.form.get('model', 'gemini-3.1-flash-image-preview')

    if not files or files[0].filename == '':
        return jsonify({'error': '没有上传图片'}), 400
    if not prompt:
        return jsonify({'error': '描述不能为空'}), 400

    try:
        client = genai.Client(api_key=stored_key)

        is_pro_model = 'pro' in model.lower()
        parts = []
        for i, file in enumerate(files):
            normalized_bytes, mime_type, error = validate_and_normalize_image(file)
            if error:
                return jsonify({'error': f'第{i+1}张图片: {error}'}), 400
            parts.append(types.Part.from_bytes(data=normalized_bytes, mime_type=mime_type))
        parts.append(types.Part.from_text(text=prompt))

        contents = [types.Content(role='user', parts=parts)]

        generate_content_config = types.GenerateContentConfig(
            thinking_config=None if is_pro_model else types.ThinkingConfig(
                thinking_level=thinking_level,
            ),
            image_config=types.ImageConfig(
                aspect_ratio=aspect_ratio,
                image_size=image_size,
            ),
            response_modalities=['IMAGE', 'TEXT'],
        )

        image_data = None
        image_mime = None

        for chunk in client.models.generate_content_stream(
            model=model,
            contents=contents,
            config=generate_content_config,
        ):
            if chunk.parts:
                for part in chunk.parts:
                    if part.inline_data and part.inline_data.data:
                        image_data = part.inline_data.data
                        image_mime = part.inline_data.mime_type

        if not image_data:
            return jsonify({'error': '未生成图片'}), 500

        import base64
        image_base64 = base64.b64encode(image_data).decode('utf-8')

        return jsonify({
            'success': True,
            'image_data': image_base64,
            'mime_type': image_mime,
            'model': model
        })

    except Exception as e:
        error_msg = str(e)
        if 'Unable to process input image' in error_msg:
            return jsonify({'error': '参考图片无法处理，请尝试其他图片格式或更小的文件'}), 400
        if 'not found' in error_msg.lower() or '404' in error_msg:
            return jsonify({'error': f'模型 {model} 不存在'}), 400
        return jsonify({'error': error_msg}), 500

if __name__ == '__main__':
    database.init_db()
    database.init_template_db()
    database.init_video_db()
    app.run(host='0.0.0.0', port=5000, debug=True, use_reloader=False)