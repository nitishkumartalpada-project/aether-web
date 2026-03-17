import { useState } from "react";
import axios from "axios";

export default function Upload() {
	const [formData, setFormData] = useState({
		title: "",
		description: "",
		genre: "Tech",
		type: "video",
	});
	const [mediaFile, setMediaFile] = useState(null);
	const [thumbnailFile, setThumbnailFile] = useState(null); // NEW: Thumbnail state

	const handleChange = (e) => {
		setFormData({ ...formData, [e.target.name]: e.target.value });
	};

	const handleMedia = (e) => {
		setMediaFile(e.target.files[0]);
	};

	const handleThumbnail = (e) => {
		setThumbnailFile(e.target.files[0]);
	};

	const handleSubmit = async (e) => {
		e.preventDefault();
		if (!mediaFile || !thumbnailFile) {
			alert("Aether Core requires both a Media File and a Thumbnail!");
			return;
		}

		// Package the dual-file payload
		const submitData = new FormData();
		submitData.append("title", formData.title);
		submitData.append("description", formData.description);
		submitData.append("genre", formData.genre);
		submitData.append("type", formData.type);
		submitData.append("mediaFile", mediaFile);
		submitData.append("thumbnailFile", thumbnailFile); // NEW: Attach thumbnail

		try {
			console.log("Transmitting to Aether Core...");
			const response = await axios.post(
				`${import.meta.env.VITE_API_URL}/api/ingest`,
				submitData,
				{
					headers: { "Content-Type": "multipart/form-data" },
				},
			);
			alert(response.data.message);
		} catch (error) {
			console.error("Transmission failed:", error);
			alert("Backend connection failed. Is server.js running?");
		}
	};

	return (
		<div className="page-container">
			<div className="upload-container">
				<h2
					style={{
						marginTop: 0,
						marginBottom: "30px",
						color: "#fff",
						fontSize: "2rem",
					}}
				>
					Ingest Media
				</h2>
				<form onSubmit={handleSubmit}>
					<div className="form-group">
						<label>Title</label>
						<input
							type="text"
							name="title"
							className="form-control"
							onChange={handleChange}
							required
							placeholder="Enter content title..."
						/>
					</div>

					<div
						style={{
							display: "grid",
							gridTemplateColumns: "1fr 1fr",
							gap: "20px",
						}}
					>
						<div className="form-group">
							<label>Format</label>
							<select
								name="type"
								className="form-control"
								onChange={handleChange}
							>
								<option value="video">
									Standard Video (up to 10 min)
								</option>
								<option value="short">
									Aether Short (Vertical, max 3 min)
								</option>
							</select>
						</div>

						<div className="form-group">
							<label>Genre Core</label>
							<select
								name="genre"
								className="form-control"
								onChange={handleChange}
							>
								<option value="Tech">Tech & Coding</option>
								<option value="Gaming">Gaming</option>
								<option value="Education">Education</option>
								<option value="Entertainment">
									Entertainment
								</option>
								<option value="Vlog">Vlog & Lifestyle</option>
							</select>
						</div>
					</div>

					<div className="form-group">
						<label>AI Recommendation Context (Description)</label>
						<textarea
							name="description"
							className="form-control"
							rows="3"
							onChange={handleChange}
							required
							placeholder="Provide context for the recommendation engine..."
						></textarea>
					</div>

					<div
						style={{
							display: "grid",
							gridTemplateColumns: "1fr 1fr",
							gap: "20px",
						}}
					>
						<div className="form-group">
							<label>Thumbnail Cover (.jpg, .png)</label>
							<input
								type="file"
								accept="image/*"
								className="form-control"
								onChange={handleThumbnail}
								required
								style={{ padding: "11px 15px" }}
							/>
						</div>

						<div className="form-group">
							<label>Media Source (.mp4)</label>
							<input
								type="file"
								accept="video/mp4"
								className="form-control"
								onChange={handleMedia}
								required
								style={{ padding: "11px 15px" }}
							/>
						</div>
					</div>

					<button type="submit" className="submit-btn">
						Initialize Pipeline
					</button>
				</form>
			</div>
		</div>
	);
}
