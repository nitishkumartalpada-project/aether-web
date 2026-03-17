import { useEffect, useRef, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import Hls from "hls.js";
import axios from "axios";
import { getOrCreateGhostId } from "./utils/identity";

const generateAnonName = () => {
	const now = new Date();
	return `Anon_${now.getDate().toString().padStart(2, "0")}${now.toLocaleString("default", { month: "short" })}_${now.getHours().toString().padStart(2, "0")}${now.getMinutes().toString().padStart(2, "0")}`;
};

export default function Player() {
	const navigate = useNavigate();
	const location = useLocation();
	const queryParams = new URLSearchParams(location.search);
	const mediaId = queryParams.get("id");

	const videoRef = useRef(null);
	const hlsRef = useRef(null);
	const ghostId = getOrCreateGhostId();

	const [media, setMedia] = useState(null);
	const [loading, setLoading] = useState(true);
	const [quality, setQuality] = useState("Auto");
	const [showMenu, setShowMenu] = useState(false);

	const [hasLiked, setHasLiked] = useState(false);
	const [likesCount, setLikesCount] = useState(0);
	const [comments, setComments] = useState([]);
	const [newComment, setNewComment] = useState("");

	// 1. Fetch Media from DB
	useEffect(() => {
		if (!mediaId) return;
		axios
			.get(`${import.meta.env.VITE_API_URL}/api/media/${mediaId}`)
			.then((res) => {
				setMedia(res.data);
				setLikesCount(res.data.likes.length);
				setHasLiked(res.data.likes.includes(ghostId));
				setComments(res.data.comments);
				setLoading(false);
			})
			.catch((err) => console.error("Failed to load video data"));
	}, [mediaId, ghostId]);

	// 2. Initialize HLS & Smart Telemetry (Edge Aggregation)
	const watchTimeRef = useRef(0);

	useEffect(() => {
		const video = videoRef.current;
		if (!video || !media || !media.masterUrl) return;

		const handleTimeUpdate = () => {
			watchTimeRef.current = Math.floor(video.currentTime);
		};
		video.addEventListener("timeupdate", handleTimeUpdate);

		if (Hls.isSupported()) {
			const hls = new Hls();
			hlsRef.current = hls;
			hls.loadSource(media.masterUrl);
			hls.attachMedia(video);
		} else if (video.canPlayType("application/vnd.apple.mpegurl")) {
			video.src = media.masterUrl;
		}

		return () => {
			if (hlsRef.current) hlsRef.current.destroy();
			if (video)
				video.removeEventListener("timeupdate", handleTimeUpdate);

			if (watchTimeRef.current >= 2) {
				axios
					.post(`${import.meta.env.VITE_API_URL}/api/telemetry`, {
						ghostId: ghostId,
						mediaId: media._id,
						genre: media.genre,
						watchTimeSeconds: watchTimeRef.current,
					})
					.catch(() => {});
			}
		};
	}, [media, ghostId]);

	const handleLike = async () => {
		try {
			const res = await axios.post(
				`${import.meta.env.VITE_API_URL}/api/media/${media._id}/like`,
				{ ghostId },
			);
			setHasLiked(res.data.hasLiked);
			setLikesCount(res.data.likes);
		} catch (error) {
			console.error("Like failed");
		}
	};

	const handleCommentSubmit = async (e) => {
		e.preventDefault();
		if (!newComment.trim()) return;
		try {
			const res = await axios.post(
				`${import.meta.env.VITE_API_URL}/api/media/${media._id}/comment`,
				{ username: generateAnonName(), text: newComment },
			);
			setComments([res.data.comment, ...comments]);
			setNewComment("");
		} catch (error) {
			console.error("Comment failed");
		}
	};

	const changeQuality = (levelIndex, label) => {
		if (hlsRef.current) {
			hlsRef.current.currentLevel = levelIndex;
			setQuality(label);
			setShowMenu(false);
		}
	};

	if (loading)
		return (
			<div className="page-container">
				<h2 style={{ color: "#8b5cf6", textAlign: "center" }}>
					BUFFERING AETHER CORE...
				</h2>
			</div>
		);

	return (
		<div className="player-wrapper">
			{/* The Responsive CSS Engine for the Standard Player */}
			<style>{`
                .player-wrapper {
                    max-width: 1200px;
                    margin: 0 auto;
                    padding: 90px 20px 100px 20px;
                }
                .back-btn {
                    background: transparent;
                    color: #8b5cf6;
                    border: none;
                    padding: 0 0 15px 0;
                    cursor: pointer;
                    font-weight: 700;
                    font-size: 0.9rem;
                    display: flex;
                    align-items: center;
                    gap: 5px;
                }
                .back-btn:hover { color: #a78bfa; }
                .video-container {
                    width: 100%;
                    aspect-ratio: 16 / 9;
                    background-color: #000;
                    border-radius: 12px;
                    overflow: hidden;
                    box-shadow: 0 10px 30px rgba(0,0,0,0.6);
                }
                .video-title {
                    margin: 15px 0 8px 0;
                    font-size: 1.4rem;
                    color: #fff;
                    font-weight: 800;
                }
                .video-meta-bar {
                    display: flex;
                    justify-content: space-between;
                    align-items: flex-start;
                    border-bottom: 1px solid rgba(255,255,255,0.1);
                    padding-bottom: 15px;
                    flex-wrap: wrap;
                    gap: 15px;
                }
                .video-stats {
                    color: #aaa;
                    font-size: 0.9rem;
                    display: flex;
                    gap: 15px;
                    align-items: center;
                    font-weight: 500;
                }
                .action-buttons {
                    display: flex;
                    gap: 10px;
                    align-items: center;
                }
                .pill-btn {
                    background: rgba(255,255,255,0.1);
                    border: 1px solid transparent;
                    padding: 8px 16px;
                    border-radius: 20px;
                    color: white;
                    cursor: pointer;
                    font-weight: 600;
                    font-size: 0.85rem;
                    display: flex;
                    align-items: center;
                    gap: 6px;
                    transition: 0.2s;
                }
                .pill-btn:hover { background: rgba(255,255,255,0.15); }
                .pill-btn.liked { background: rgba(229, 9, 20, 0.1); color: #e50914; border-color: rgba(229, 9, 20, 0.3); }
                .desc-box {
                    background-color: rgba(255,255,255,0.03);
                    padding: 15px;
                    border-radius: 8px;
                    margin-top: 15px;
                    color: #ddd;
                    line-height: 1.5;
                    font-size: 0.95rem;
                }
                .comments-section { margin-top: 30px; }
                
                /* Mobile Override: Edge-to-Edge Video, Compact UI */
                @media (max-width: 768px) {
                    .player-wrapper { padding: 60px 0 80px 0; }
                    .back-btn { padding: 10px 15px; margin: 0; }
                    .video-container { border-radius: 0; box-shadow: none; border-bottom: 1px solid rgba(255,255,255,0.1); }
                    .video-title { font-size: 1.1rem; padding: 0 15px; margin-top: 12px; }
                    .video-meta-bar { flex-direction: column; padding: 0 15px 15px 15px; gap: 12px; }
                    .video-stats { font-size: 0.8rem; }
                    .action-buttons { width: 100%; overflow-x: auto; padding-bottom: 5px; }
                    .action-buttons::-webkit-scrollbar { display: none; }
                    .desc-box, .comments-section { margin-left: 15px; margin-right: 15px; }
                }
            `}</style>

			<button className="back-btn" onClick={() => navigate(-1)}>
				← Back to Feed
			</button>

			{/* 16:9 Edge-to-Edge Video Player */}
			<div className="video-container">
				<video
					ref={videoRef}
					controls
					autoPlay
					style={{
						width: "100%",
						height: "100%",
						objectFit: "contain",
					}}
				/>
			</div>

			{/* Video Info & Social Bar */}
			<h1 className="video-title">{media.title}</h1>

			<div className="video-meta-bar">
				<div className="video-stats">
					<span>👁️ {media.views} views</span>
					<span className="badge">{media.genre}</span>
				</div>

				<div className="action-buttons">
					{/* Quality Dropdown (Pill Style) */}
					<div
						style={{ position: "relative" }}
						onMouseEnter={() => setShowMenu(true)}
						onMouseLeave={() => setShowMenu(false)}
					>
						<div className="pill-btn">⚙️ {quality}</div>
						{showMenu && (
							<div
								style={{
									position: "absolute",
									top: "100%",
									right: "0",
									paddingTop: "5px",
									zIndex: 50,
								}}
							>
								<div
									style={{
										backgroundColor:
											"rgba(15, 15, 15, 0.95)",
										padding: "10px",
										borderRadius: "12px",
										display: "flex",
										flexDirection: "column",
										gap: "2px",
										minWidth: "110px",
										border: "1px solid rgba(255,255,255,0.1)",
										boxShadow:
											"0 10px 30px rgba(0,0,0,0.8)",
									}}
								>
									<button
										onClick={() =>
											changeQuality(-1, "Auto")
										}
										style={menuBtnStyle(quality === "Auto")}
									>
										Auto
									</button>
									<button
										onClick={() =>
											changeQuality(3, "1080p")
										}
										style={menuBtnStyle(
											quality === "1080p",
										)}
									>
										1080p
									</button>
									<button
										onClick={() => changeQuality(2, "720p")}
										style={menuBtnStyle(quality === "720p")}
									>
										720p
									</button>
									<button
										onClick={() => changeQuality(1, "480p")}
										style={menuBtnStyle(quality === "480p")}
									>
										480p
									</button>
									<button
										onClick={() => changeQuality(0, "360p")}
										style={menuBtnStyle(quality === "360p")}
									>
										360p
									</button>
								</div>
							</div>
						)}
					</div>

					{/* Like Button (Pill Style) */}
					<button
						onClick={handleLike}
						className={`pill-btn ${hasLiked ? "liked" : ""}`}
					>
						<svg
							viewBox="0 0 24 24"
							fill={hasLiked ? "currentColor" : "none"}
							stroke="currentColor"
							strokeWidth="2"
							width="16"
							height="16"
						>
							<path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
						</svg>
						{likesCount}
					</button>
				</div>
			</div>

			{/* Description Box */}
			<div className="desc-box">{media.description}</div>

			{/* Comments Section */}
			<div className="comments-section">
				<h3
					style={{
						color: "white",
						marginBottom: "15px",
						fontSize: "1.1rem",
					}}
				>
					{comments.length} Comments
				</h3>

				<form
					onSubmit={handleCommentSubmit}
					style={{
						display: "flex",
						gap: "10px",
						marginBottom: "25px",
					}}
				>
					<input
						type="text"
						value={newComment}
						onChange={(e) => setNewComment(e.target.value)}
						placeholder="Add a comment..."
						style={{
							flexGrow: 1,
							backgroundColor: "rgba(255,255,255,0.05)",
							border: "1px solid rgba(255,255,255,0.1)",
							color: "white",
							padding: "10px 15px",
							borderRadius: "20px",
							outline: "none",
							fontSize: "0.9rem",
						}}
					/>
					<button
						type="submit"
						style={{
							backgroundColor: "#8b5cf6",
							color: "white",
							border: "none",
							padding: "0 20px",
							borderRadius: "20px",
							fontWeight: "bold",
							cursor: "pointer",
							fontSize: "0.9rem",
						}}
					>
						Post
					</button>
				</form>

				<div
					style={{
						display: "flex",
						flexDirection: "column",
						gap: "20px",
					}}
				>
					{comments.map((c) => (
						<div
							key={c._id || c.timestamp}
							style={{ display: "flex", gap: "12px" }}
						>
							<div
								style={{
									width: "36px",
									height: "36px",
									borderRadius: "50%",
									backgroundColor: "#8b5cf6",
									display: "flex",
									justifyContent: "center",
									alignItems: "center",
									fontWeight: "bold",
									color: "white",
									flexShrink: 0,
								}}
							>
								{c.username.charAt(0)}
							</div>
							<div>
								<span
									style={{
										color: "#aaa",
										fontSize: "0.8rem",
										fontWeight: "bold",
									}}
								>
									{c.username}
								</span>
								<p
									style={{
										color: "#e5e5e5",
										margin: "4px 0 0 0",
										fontSize: "0.9rem",
										lineHeight: "1.4",
									}}
								>
									{c.text}
								</p>
							</div>
						</div>
					))}
				</div>
			</div>
		</div>
	);
}

// Reusable styling for dropdown buttons
const menuBtnStyle = (isActive) => ({
	background: isActive ? "rgba(139, 92, 246, 0.15)" : "transparent",
	color: isActive ? "#8b5cf6" : "white",
	border: "none",
	borderRadius: "6px",
	cursor: "pointer",
	fontWeight: "bold",
	padding: "8px 10px",
	textAlign: "left",
	transition: "0.2s",
});
