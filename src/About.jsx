import { useNavigate } from "react-router-dom";
// 1. IMPORT YOUR IMAGE HERE
// Make sure the path exactly matches your folder structure and file name!
import profilePic from "./assets/photo.jpg";

export default function About() {
	const navigate = useNavigate();

	const handleAdminAccess = () => {
		navigate("/admin");
	};

	return (
		<div
			className="page-container"
			style={{
				maxWidth: "800px",
				margin: "0 auto",
				paddingBottom: "100px",
			}}
		>
			<div style={{ textAlign: "center", marginBottom: "40px" }}>
				<h1
					style={{
						color: "#fff",
						fontSize: "2.5rem",
						margin: "0 0 10px 0",
					}}
				>
					About Aether
				</h1>
				<p
					style={{
						color: "#8b5cf6",
						fontWeight: "bold",
						letterSpacing: "2px",
						margin: 0,
						fontSize: "0.9rem",
					}}
				>
					NEXT-GEN CONTENT DELIVERY
				</p>
			</div>

			<div
				style={{
					backgroundColor: "rgba(255,255,255,0.03)",
					padding: "25px",
					borderRadius: "12px",
					border: "1px solid rgba(255,255,255,0.1)",
					marginBottom: "40px",
				}}
			>
				<h2
					style={{ color: "white", marginTop: 0, fontSize: "1.4rem" }}
				>
					The Architecture
				</h2>
				<p
					style={{
						color: "#ccc",
						lineHeight: "1.7",
						fontSize: "0.95rem",
						margin: 0,
					}}
				>
					Aether is an advanced, distributed media streaming platform.
					It utilizes automated FFmpeg ingestion to dynamically
					generate Adaptive Bitrate HLS streams, ensuring
					zero-buffering playback. The platform features an
					intelligent, real-time recommendation engine powered by
					Upstash Redis and Apache Spark, mathematically analyzing
					user telemetry to curate highly personalized content feeds.
				</p>
			</div>

			<div
				style={{
					display: "flex",
					flexDirection: "column",
					alignItems: "center",
					backgroundColor: "#111",
					padding: "30px 20px",
					borderRadius: "12px",
					boxShadow: "0 10px 30px rgba(0,0,0,0.8)",
				}}
			>
				{/* 2. USE THE IMPORTED VARIABLE HERE */}
				{/* Notice the curly braces {profilePic} instead of quote marks */}
				<img
					src={profilePic}
					alt="Nitish Talpada"
					style={{
						width: "110px",
						height: "110px",
						borderRadius: "50%",
						border: "3px solid #8b5cf6",
						marginBottom: "15px",
						objectFit: "cover",
					}}
				/>

				<h2
					style={{
						color: "white",
						margin: "0 0 5px 0",
						fontSize: "1.5rem",
					}}
				>
					Nitish Talpada
				</h2>
				<p
					style={{
						color: "#aaa",
						margin: "0 0 25px 0",
						fontSize: "0.9rem",
						fontWeight: "500",
					}}
				>
					Lead Architect & Full-Stack Developer
				</p>

				<div style={{ width: "100%", maxWidth: "600px" }}>
					<p
						style={{
							color: "#ddd",
							textAlign: "left",
							lineHeight: "1.7",
							marginBottom: "30px",
							fontSize: "0.95rem",
						}}
					>
						As a CSE student at PDEU, I am deeply passionate about
						pushing the boundaries of the MERN stack, Big Data, and
						AI/ML. I architected Aether to demonstrate how
						enterprise-grade distributed systems and real-time
						machine learning can be engineered from the ground up.
					</p>
				</div>

				<a
					href="mailto:nitishtalpada@gmail.com"
					style={{
						backgroundColor: "#8b5cf6",
						color: "white",
						padding: "12px 24px",
						borderRadius: "25px",
						textDecoration: "none",
						fontWeight: "bold",
						transition: "0.2s",
						fontSize: "0.9rem",
						display: "inline-block",
						maxWidth: "100%",
						overflow: "hidden",
						textOverflow: "ellipsis",
						whiteSpace: "nowrap",
					}}
				>
					nitishtalpada@gmail.com
				</a>
			</div>

			<div style={{ textAlign: "center", marginTop: "50px" }}>
				<button
					onClick={handleAdminAccess}
					style={{
						background: "transparent",
						color: "rgba(255,255,255,0.05)",
						border: "none",
						cursor: "pointer",
						fontSize: "0.75rem",
						transition: "color 0.3s",
					}}
					onMouseEnter={(e) => (e.target.style.color = "#e50914")}
					onMouseLeave={(e) =>
						(e.target.style.color = "rgba(255,255,255,0.05)")
					}
				>
					π Server Administration
				</button>
			</div>
		</div>
	);
}
