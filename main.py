from flask import Flask, render_template, jsonify, request
import cloudinary
import cloudinary.uploader
from config import api_key, cloud_name, api_secret

app = Flask(__name__)

# Cloudinary configuration
cloudinary.config(
    cloud_name=cloud_name,
    api_key=api_key,
    api_secret=api_secret,
    secure=True
)

@app.route("/")
def home():
    return render_template("home.html")

@app.route("/features")
def features():
    return render_template("features.html")

@app.route("/playground")
def playground():
    return render_template("playground.html")

@app.route("/upload", methods=["POST"])
def upload_image():
    file_to_upload = request.files['file']
    if file_to_upload:
        uploader_result = cloudinary.uploader.upload(file_to_upload)
        return jsonify({
            'url': uploader_result.get('secure_url'),
            'public_id': uploader_result.get('public_id')
        })
    return jsonify({'error': 'No file uploaded'})

@app.route("/process", methods=["POST"])
def process_image():
    data = request.get_json()
    public_id = data.get('public_id')
    action = data.get('action')
    width = data.get('width')
    height = data.get('height')
    aspect_ratio = data.get('aspectRatio')
    from_src = data.get('fromSrc')
    to_src = data.get('toSrc')

    # Define transformations based on action
    transformations = {
        "bg_replace": {"effect": f"gen_replace:from_{from_src};to_{to_src}"},
        "resize": {"gravity": "auto", "width": width, "height": height, "crop": "fill"},
        "ai_enhance": {"effect": "enhance"},
        "gen_fill": {"aspect_ratio": aspect_ratio, "gravity": "center", "background": "gen_fill", "crop": "pad"},
        "upscale": {"effect": "upscale"}
    }

    try:
        if action in transformations:
            transformation_params = transformations[action]
            if action == "resize" and (not width or not height):
                return jsonify({"error": "Width and height are required for resizing"}), 400

            if action == "bg_replace" and (not from_src or not to_src):
             return jsonify({"error": "From and to values are required for background replacement"}),    400

            img_url = cloudinary.CloudinaryImage(public_id).build_url(**transformation_params)
            return jsonify({
                'processed_url': img_url
            })
        else:
         return jsonify({'error': 'Invalid transformation action'}), 400
    except Exception as e:
        print(f"Error processing image with action '{action}': {e}")
        return jsonify({'error': 'Image processing error occurred'}), 500

if __name__ == "__main__":
    app.run(debug=True)