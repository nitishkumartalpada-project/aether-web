import { useState, useEffect, useRef } from "react";
import axios from "axios";
import Hls from "hls.js";
import { getOrCreateGhostId } from "./utils/identity";

const formatCount = (num) =>
	Intl.NumberFormat("en-US", {
		notation: "compact",
		maximumFractionDigits: 1,
	}).format(num || 0);

const generateAnonName = () => {
	const now = new Date();
	const day = now.getDate().toString().padStart(2, "0");
	const month = now.toLocaleString("default", { month: "short" });
	const hours = now.getHours().toString().padStart(2, "0");
	const mins = now.getMinutes().toString().padStart(2, "0");
	return `Anon_${day}${month}_${hours}${mins}`;
};

const ShortVideo = ({ media }) => {
	const videoRef = useRef(null);
	const ghostId = getOrCreateGhostId();

	const [isPlaying, setIsPlaying] = useState(false);
	const [showComments, setShowComments] = useState(false);
	const [isExpanded, setIsExpanded] = useState(false);

	// HLS Quality States
	const [quality, setQuality] = useState("Auto");
	const [showQualityMenu, setShowQualityMenu] = useState(false);
	const hlsRef = useRef(null);

	// DB Synced States
	const [likesCount, setLikesCount] = useState(media.likes?.length || 0);
	const [hasLiked, setHasLiked] = useState(
		media.likes?.includes(ghostId) || false,
	);
	const [comments, setComments] = useState(media.comments || []);
	const [newComment, setNewComment] = useState("");

	useEffect(() => {
		const video = videoRef.current;
		if (!video || !media.masterUrl) return;

		let hls;
		if (Hls.isSupported()) {
			hls = new Hls();
			hlsRef.current = hls; // SAVE IT HERE
			hls.loadSource(media.masterUrl);
			hls.attachMedia(video);
		} else if (video.canPlayType("application/vnd.apple.mpegurl")) {
			video.src = media.masterUrl;
		}
		return () => {
			if (hls) hls.destroy();
		};
	}, [media.masterUrl]);

	// Smart Telemetry & Auto-Play for Shorts
	const watchTimeRef = useRef(0);

	useEffect(() => {
		const video = videoRef.current;
		if (!video) return;

		const handleTimeUpdate = () => {
			watchTimeRef.current = Math.floor(video.currentTime);
		};
		video.addEventListener("timeupdate", handleTimeUpdate);

		const observer = new IntersectionObserver(
			(entries) => {
				entries.forEach((entry) => {
					if (entry.isIntersecting) {
						video
							.play()
							.then(() => setIsPlaying(true))
							.catch(() => setIsPlaying(false));

						// Add +1 View to MongoDB
						axios
							.post(
								`${import.meta.env.VITE_API_URL}/api/media/${media._id}/view`,
							)
							.catch((e) => console.log(e));
					} else {
						video.pause();
						setIsPlaying(false);
						setShowComments(false);

						if (watchTimeRef.current >= 2) {
							axios
								.post(
									`${import.meta.env.VITE_API_URL}/api/telemetry`,
									{
										ghostId: ghostId,
										mediaId: media._id,
										genre: media.genre,
										watchTimeSeconds: watchTimeRef.current,
									},
								)
								.catch(() => {});
						}

						watchTimeRef.current = 0;
					}
				});
			},
			{ threshold: 0.6 },
		);
		if (video) observer.observe(video);

		return () => {
			observer.disconnect();
			if (video)
				video.removeEventListener("timeupdate", handleTimeUpdate);
		};
	}, [media, ghostId]);

	const togglePlay = () => {
		if (isPlaying) {
			videoRef.current?.pause();
			setIsPlaying(false);
		} else {
			videoRef.current?.play();
			setIsPlaying(true);
		}
	};

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
			const username = generateAnonName();
			const res = await axios.post(
				`${import.meta.env.VITE_API_URL}/api/media/${media._id}/comment`,
				{ username, text: newComment },
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
			setShowQualityMenu(false);
		}
	};

	return (
		<div className="short-container">
			<div className="short-wrapper">
				{/* --- VIDEO BOX --- */}
				<div className="short-video-box">
					<video
						ref={videoRef}
						loop
						playsInline
						onClick={togglePlay}
						style={{
							height: "100%",
							width: "100%",
							objectFit: "cover",
							cursor: "pointer",
						}}
					/>

					{/* --- RESPONSIVE: Shorts Quality Gear --- */}
					<div
						className="shorts-quality-gear"
						onMouseEnter={() => setShowQualityMenu(true)}
						onMouseLeave={() => setShowQualityMenu(false)}
					>
						<div
							style={{
								backgroundColor: "rgba(0, 0, 0, 0.6)",
								backdropFilter: "blur(5px)",
								color: "white",
								padding: "6px 10px",
								borderRadius: "6px",
								cursor: "pointer",
								fontWeight: "bold",
								fontSize: "0.8rem",
								border: "1px solid rgba(255,255,255,0.1)",
							}}
						>
							⚙️ {quality}
						</div>
						{showQualityMenu && (
							<div
								style={{
									position: "absolute",
									top: "100%",
									right: "0",
									paddingTop: "5px",
								}}
							>
								<div
									style={{
										backgroundColor:
											"rgba(15, 15, 15, 0.95)",
										padding: "10px",
										borderRadius: "8px",
										display: "flex",
										flexDirection: "column",
										gap: "5px",
										minWidth: "90px",
										border: "1px solid rgba(255,255,255,0.1)",
									}}
								>
									<button
										onClick={() =>
											changeQuality(-1, "Auto")
										}
										style={btnStyle(quality === "Auto")}
									>
										Auto
									</button>
									<button
										onClick={() =>
											changeQuality(3, "1080p")
										}
										style={btnStyle(quality === "1080p")}
									>
										1080p
									</button>
									<button
										onClick={() => changeQuality(2, "720p")}
										style={btnStyle(quality === "720p")}
									>
										720p
									</button>
									<button
										onClick={() => changeQuality(1, "480p")}
										style={btnStyle(quality === "480p")}
									>
										480p
									</button>
									<button
										onClick={() => changeQuality(0, "360p")}
										style={btnStyle(quality === "360p")}
									>
										360p
									</button>
								</div>
							</div>
						)}
					</div>

					{/* Play/Pause Indicator Overlay */}
					{!isPlaying && (
						<div
							style={{
								position: "absolute",
								top: "50%",
								left: "50%",
								transform: "translate(-50%, -50%)",
								pointerEvents: "none",
								width: "70px",
								height: "70px",
								backgroundColor: "rgba(0,0,0,0.6)",
								borderRadius: "50%",
								display: "flex",
								justifyContent: "center",
								alignItems: "center",
							}}
						>
							<svg
								width="28"
								height="28"
								viewBox="0 0 24 24"
								fill="white"
							>
								<path d="M8 5v14l11-7z" />
							</svg>
						</div>
					)}

					{/* Metadata Overlay */}
					<div
						style={{
							position: "absolute",
							bottom: "25px",
							left: "15px",
							zIndex: 10,
							width: "75%",
							pointerEvents: "none",
						}}
					>
						<h2
							style={{
								margin: "0 0 8px 0",
								fontSize: "1.1rem",
								color: "#fff",
								textShadow: "0 1px 3px rgba(0,0,0,0.8)",
							}}
						>
							{media.title}
						</h2>

						<p
							className="shorts-description"
							onClick={(e) => {
								e.stopPropagation();
								setIsExpanded(!isExpanded);
							}}
							style={{
								margin: "0 0 12px 0",
								fontSize: "0.9rem",
								color: "#ddd",
								textShadow: "0 1px 3px rgba(0,0,0,0.8)",
								cursor: "pointer",
								display: "-webkit-box",
								WebkitLineClamp: isExpanded ? "unset" : 2,
								WebkitBoxOrient: "vertical",
								overflow: "hidden",
								textOverflow: "ellipsis",
							}}
						>
							{media.description}
						</p>
						<span
							className="badge"
							style={{ pointerEvents: "auto" }}
						>
							{media.genre}
						</span>
					</div>

					{/* Comment Panel Overlay */}
					{showComments && (
						<div
							style={{
								position: "absolute",
								bottom: 0,
								left: 0,
								width: "100%",
								height: "65%",
								backgroundColor: "rgba(15, 15, 15, 0.95)",
								backdropFilter: "blur(15px)",
								borderTopLeftRadius: "16px",
								borderTopRightRadius: "16px",
								zIndex: 20,
								display: "flex",
								flexDirection: "column",
								borderTop: "1px solid rgba(255,255,255,0.1)",
								animation: "slideUp 0.3s ease-out",
							}}
						>
							<div
								style={{
									padding: "15px 20px",
									display: "flex",
									justifyContent: "space-between",
									alignItems: "center",
									borderBottom:
										"1px solid rgba(255,255,255,0.1)",
								}}
							>
								<h3
									style={{
										margin: 0,
										color: "white",
										fontSize: "1.1rem",
									}}
								>
									Comments{" "}
									<span style={{ color: "#8b5cf6" }}>
										({comments.length})
									</span>
								</h3>
								<button
									onClick={() => setShowComments(false)}
									style={{
										background: "transparent",
										border: "none",
										color: "#aaa",
										fontSize: "1.5rem",
										cursor: "pointer",
									}}
								>
									×
								</button>
							</div>
							<div
								style={{
									flexGrow: 1,
									overflowY: "auto",
									padding: "20px",
								}}
							>
								{comments.map((c) => (
									<div
										key={c._id || c.timestamp}
										style={{ marginBottom: "20px" }}
									>
										<span
											style={{
												color: "#8b5cf6",
												fontSize: "0.85rem",
												fontWeight: "bold",
											}}
										>
											{c.username}
										</span>
										<p
											style={{
												color: "#e5e5e5",
												margin: "5px 0 0 0",
												fontSize: "0.95rem",
											}}
										>
											{c.text}
										</p>
									</div>
								))}
							</div>
							<form
								onSubmit={handleCommentSubmit}
								style={{
									padding: "15px",
									borderTop:
										"1px solid rgba(255,255,255,0.1)",
									display: "flex",
									gap: "10px",
								}}
							>
								<input
									type="text"
									value={newComment}
									onChange={(e) =>
										setNewComment(e.target.value)
									}
									placeholder="Add a comment..."
									style={{
										flexGrow: 1,
										backgroundColor:
											"rgba(255,255,255,0.05)",
										border: "1px solid rgba(255,255,255,0.1)",
										padding: "12px 15px",
										borderRadius: "25px",
										color: "white",
										outline: "none",
									}}
								/>
								<button
									type="submit"
									style={{
										backgroundColor: "#8b5cf6",
										color: "white",
										border: "none",
										padding: "0 20px",
										borderRadius: "25px",
										fontWeight: "bold",
										cursor: "pointer",
									}}
								>
									Post
								</button>
							</form>
						</div>
					)}
				</div>

				{/* --- ACTION BAR --- */}
				<div className="short-actions">
					{/* Views Indicator */}
					<div className="action-btn">
						<div className="action-icon-bg">
							<svg
								viewBox="0 0 24 24"
								fill="none"
								stroke="white"
								strokeWidth="2"
								width="28"
								height="28"
								style={{
									dropShadow: "0 2px 4px rgba(0,0,0,0.5)",
								}}
							>
								<path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
								<circle cx="12" cy="12" r="3"></circle>
							</svg>
						</div>
						<span
							style={{
								color: "white",
								fontSize: "0.85rem",
								fontWeight: "bold",
								textShadow: "0 1px 2px rgba(0,0,0,0.8)",
							}}
						>
							{formatCount(media.views)}
						</span>
					</div>

					{/* Like Button */}
					<div className="action-btn" onClick={handleLike}>
						<div className="action-icon-bg">
							<svg
								viewBox="0 0 24 24"
								fill={hasLiked ? "#e50914" : "rgba(0,0,0,0.4)"}
								stroke={hasLiked ? "#e50914" : "white"}
								strokeWidth="2"
								width="28"
								height="28"
								style={{
									dropShadow: "0 2px 4px rgba(0,0,0,0.5)",
								}}
							>
								<path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
							</svg>
						</div>
						<span
							style={{
								color: "white",
								fontSize: "0.85rem",
								fontWeight: "bold",
								textShadow: "0 1px 2px rgba(0,0,0,0.8)",
							}}
						>
							{formatCount(likesCount)}
						</span>
					</div>

					{/* Comment Button */}
					<div
						className="action-btn"
						onClick={() => setShowComments(!showComments)}
					>
						<div className="action-icon-bg">
							<svg
								viewBox="0 0 24 24"
								fill="rgba(0,0,0,0.4)"
								stroke="white"
								strokeWidth="2"
								width="28"
								height="28"
								style={{
									dropShadow: "0 2px 4px rgba(0,0,0,0.5)",
								}}
							>
								<path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"></path>
							</svg>
						</div>
						<span
							style={{
								color: "white",
								fontSize: "0.85rem",
								fontWeight: "bold",
								textShadow: "0 1px 2px rgba(0,0,0,0.8)",
							}}
						>
							{formatCount(comments.length)}
						</span>
					</div>
				</div>
			</div>
		</div>
	);
};

export default function Shorts() {
	const [shorts, setShorts] = useState([]);
	const [loading, setLoading] = useState(true);

	useEffect(() => {
		const ghostId = getOrCreateGhostId();

		axios
			.get(
				`${import.meta.env.VITE_API_URL}/api/shorts?ghostId=${ghostId}`,
			)
			.then((res) => {
				setShorts(res.data);
				setLoading(false);
			})
			.catch(() => setLoading(false));
	}, []);

	if (loading)
		return (
			<div className="page-container">
				<h2 style={{ color: "#8b5cf6", textAlign: "center" }}>
					SYNCING SHORTS...
				</h2>
			</div>
		);

	return (
		<div
			style={{
				/* FIX B: Changed 100vh to 100dvh for mobile address bar correction */
				height: "100dvh",
				width: "100vw",
				overflowY: "scroll",
				scrollSnapType: "y mandatory",
				margin: 0,
				padding: 0,
				backgroundColor: "#000",
			}}
		>
			{/* The Responsive CSS Engine for YouTube-Style Shorts */}
			<style>
				{`
                ::-webkit-scrollbar { width: 0px; background: transparent; }
                
                .short-container {
                    height: 100dvh;
                    width: 100vw;
                    scroll-snap-align: start;
                    display: flex;
                    justify-content: center;
                    align-items: center;
                    padding-top: 80px; 
                    padding-bottom: 30px;
                }
                
                .short-wrapper {
                    position: relative;
                    display: flex;
                    align-items: flex-end;
                    height: 100%;
                    max-height: 850px;
                    gap: 20px;
                }
                
                .short-video-box {
                    height: 100%;
                    aspect-ratio: 9 / 16;
                    background-color: #111;
                    border-radius: 16px;
                    overflow: hidden;
                    position: relative;
                    box-shadow: 0 10px 40px rgba(0,0,0,0.6);
                }
                
                .short-actions {
                    display: flex;
                    flex-direction: column;
                    gap: 20px;
                    padding-bottom: 15px;
                }
                
                .action-btn {
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    gap: 6px;
                    cursor: pointer;
                    transition: transform 0.2s;
                }
                
                .action-btn:hover {
                    transform: scale(1.05);
                }
                
                .action-icon-bg {
                    background-color: rgba(255,255,255,0.08);
                    border-radius: 50%;
                    padding: 14px;
                    display: flex;
                    justify-content: center;
                    align-items: center;
                }

                @keyframes slideUp {
                    from { transform: translateY(100%); }
                    to { transform: translateY(0); }
                }

                /* Mobile Override: Snap back to full screen Edge-to-Edge */
                @media (max-width: 768px) {
                    .short-container { padding-top: 0; padding-bottom: 0; }
                    .short-wrapper { height: 100%; width: 100%; gap: 0; max-height: none; }
                    .short-video-box { aspect-ratio: auto; border-radius: 0; width: 100%; }
                    .short-actions { position: absolute; right: 15px; bottom: 35px; z-index: 10; }
                    .action-icon-bg { background-color: transparent; padding: 0; }
                }
                
                .shorts-quality-gear {
                    position: absolute;
                    top: 15px;
                    right: 15px;
                    z-index: 30;
                }

                /* Mobile Override */
                @media (max-width: 768px) {
                    .short-container { padding-top: 0; padding-bottom: 0; }
                    .short-wrapper { height: 100%; width: 100%; gap: 0; max-height: none; }
                    .short-video-box { aspect-ratio: auto; border-radius: 0; width: 100%; }
                    .short-actions { position: absolute; right: 15px; bottom: 35px; z-index: 10; }
                    .action-icon-bg { background-color: transparent; padding: 0; }
                    
                    /* Pushes the gear down below the slim navbar on mobile */
                    .shorts-quality-gear {
                        top: 70px;
                    }
                }
                
                .shorts-description {
                    display: -webkit-box;
                    -webkit-line-clamp: 2;
                    -webkit-box-orient: vertical;
                    overflow: hidden;
                    text-overflow: ellipsis;
                }
            `}
			</style>

			{shorts.map((media) => (
				<ShortVideo key={media._id} media={media} />
			))}
		</div>
	);
}

// Reusable styling for dropdown buttons
const btnStyle = (isActive) => ({
	background: "transparent",
	color: isActive ? "#8b5cf6" : "white",
	border: "none",
	cursor: "pointer",
	fontWeight: "bold",
	padding: "5px 0",
});
