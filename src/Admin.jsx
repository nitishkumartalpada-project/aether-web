import React, { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

export default function Admin() {
	// Auth States
	const [isAuthenticated, setIsAuthenticated] = useState(false);
	const [passwordInput, setPasswordInput] = useState("");
	const [authError, setAuthError] = useState("");
	const [isLoggingIn, setIsLoggingIn] = useState(false);

	// Data States
	const [mediaList, setMediaList] = useState([]);
	const [loading, setLoading] = useState(true);
	const [expandedComments, setExpandedComments] = useState(null);

	const navigate = useNavigate();

	// --- SECURE LOGIN HANDLER ---
	const handleLogin = async (e) => {
		e.preventDefault();
		setIsLoggingIn(true);
		setAuthError("");

		try {
			// Send password to the secure backend for verification
			const res = await axios.post(
				`${import.meta.env.VITE_API_URL}/api/admin/auth`,
				{
					password: passwordInput,
				},
			);

			if (res.data.success) {
				setIsAuthenticated(true);
				fetchAdminData();
			}
		} catch (error) {
			if (error.response && error.response.data.error) {
				setAuthError(error.response.data.error);
			} else {
				setAuthError("Connection to Mainframe failed.");
			}
		}
		setIsLoggingIn(false);
	};

	const fetchAdminData = async () => {
		try {
			const res = await axios.get(
				`${import.meta.env.VITE_API_URL}/api/admin/auth`,
			);
			setMediaList(res.data);
			setLoading(false);
		} catch (error) {
			console.error("Admin fetch failed", error);
			setLoading(false);
		}
	};

	const handleDeleteMedia = async (id) => {
		if (
			!window.confirm(
				"WARNING: Are you sure you want to permanently delete this media?",
			)
		)
			return;
		try {
			await axios.delete(
				`${import.meta.env.VITE_API_URL}/api/admin/media/${id}`,
			);
			setMediaList(mediaList.filter((m) => m._id !== id));
		} catch (error) {
			alert("Deletion failed.");
		}
	};

	const handleDeleteComment = async (mediaId, commentTimestamp) => {
		if (!window.confirm("Delete this comment?")) return;
		try {
			await axios.delete(
				`${import.meta.env.VITE_API_URL}/api/admin/media/${mediaId}/comment/${commentTimestamp}`,
			);
			fetchAdminData();
		} catch (error) {
			alert("Comment deletion failed.");
		}
	};

	// --- RENDER: LOGIN SCREEN ---
	if (!isAuthenticated) {
		return (
			<div
				className="page-container"
				style={{
					display: "flex",
					justifyContent: "center",
					alignItems: "center",
					minHeight: "80vh",
				}}
			>
				<div
					style={{
						backgroundColor: "#111",
						padding: "40px",
						borderRadius: "12px",
						border: "1px solid rgba(255,255,255,0.1)",
						width: "100%",
						maxWidth: "400px",
						boxShadow: "0 20px 50px rgba(0,0,0,0.8)",
					}}
				>
					<h2
						style={{
							color: "white",
							marginTop: 0,
							textAlign: "center",
							marginBottom: "30px",
							fontSize: "1.8rem",
						}}
					>
						AETHER <span style={{ color: "#8b5cf6" }}>CORE</span>
					</h2>

					<form
						onSubmit={handleLogin}
						style={{
							display: "flex",
							flexDirection: "column",
							gap: "20px",
						}}
					>
						<div>
							<label
								style={{
									color: "#aaa",
									fontSize: "0.85rem",
									fontWeight: "bold",
									marginBottom: "8px",
									display: "block",
								}}
							>
								OVERRIDE CODE
							</label>
							<input
								type="password"
								value={passwordInput}
								onChange={(e) =>
									setPasswordInput(e.target.value)
								}
								style={{
									width: "100%",
									padding: "12px 15px",
									backgroundColor: "rgba(255,255,255,0.05)",
									border: "1px solid rgba(255,255,255,0.2)",
									borderRadius: "8px",
									color: "white",
									outline: "none",
									boxSizing: "border-box",
								}}
								placeholder="Enter credentials..."
								autoFocus
							/>
						</div>

						{authError && (
							<div
								style={{
									color: "#e50914",
									fontSize: "0.85rem",
									fontWeight: "bold",
									textAlign: "center",
								}}
							>
								{authError}
							</div>
						)}

						<button
							type="submit"
							disabled={isLoggingIn}
							style={{
								backgroundColor: "#8b5cf6",
								color: "white",
								border: "none",
								padding: "14px",
								borderRadius: "8px",
								fontWeight: "bold",
								cursor: isLoggingIn ? "not-allowed" : "pointer",
								marginTop: "10px",
							}}
						>
							{isLoggingIn
								? "AUTHENTICATING..."
								: "ACCESS MAINFRAME"}
						</button>
					</form>

					<button
						onClick={() => navigate("/")}
						style={{
							background: "transparent",
							border: "none",
							color: "#666",
							width: "100%",
							marginTop: "20px",
							cursor: "pointer",
							fontSize: "0.85rem",
						}}
					>
						Cancel and return to Feed
					</button>
				</div>
			</div>
		);
	}

	// --- RENDER: ADMIN DASHBOARD (Only visible if authenticated) ---
	if (loading)
		return (
			<h2
				style={{
					color: "white",
					textAlign: "center",
					marginTop: "50px",
				}}
			>
				SYNCING WITH AETHER CORE...
			</h2>
		);

	return (
		<div
			className="page-container"
			style={{
				maxWidth: "1200px",
				margin: "0 auto",
				paddingBottom: "100px",
			}}
		>
			<div
				style={{
					display: "flex",
					justifyContent: "space-between",
					alignItems: "center",
					borderBottom: "1px solid #e50914",
					paddingBottom: "10px",
					marginBottom: "30px",
				}}
			>
				<h1 style={{ color: "#e50914", margin: 0 }}>
					🛡️ God Mode: Administration
				</h1>
				<button
					onClick={() => setIsAuthenticated(false)}
					style={{
						background: "transparent",
						color: "#aaa",
						border: "1px solid #aaa",
						padding: "6px 15px",
						borderRadius: "20px",
						cursor: "pointer",
					}}
				>
					Lock Session
				</button>
			</div>

			<div
				style={{
					backgroundColor: "#111",
					borderRadius: "12px",
					padding: "20px",
					boxShadow: "0 10px 30px rgba(0,0,0,0.8)",
					overflowX: "auto",
				}}
			>
				<table
					style={{
						width: "100%",
						color: "white",
						borderCollapse: "collapse",
						textAlign: "left",
						minWidth: "800px",
					}}
				>
					<thead>
						<tr
							style={{
								borderBottom: "1px solid #333",
								color: "#8b5cf6",
							}}
						>
							<th style={{ padding: "15px 10px" }}>Media ID</th>
							<th style={{ padding: "15px 10px" }}>
								Title / Genre
							</th>
							<th style={{ padding: "15px 10px" }}>Stats</th>
							<th style={{ padding: "15px 10px" }}>Actions</th>
						</tr>
					</thead>
					<tbody>
						{mediaList.map((media) => (
							<React.Fragment key={media._id}>
								<tr style={{ borderBottom: "1px solid #222" }}>
									<td
										style={{
											padding: "15px 10px",
											fontSize: "0.8rem",
											color: "#666",
										}}
									>
										{media._id}
									</td>
									<td style={{ padding: "15px 10px" }}>
										<strong>{media.title}</strong>
										<br />
										<span
											style={{
												fontSize: "0.8rem",
												color: "#aaa",
											}}
										>
											{media.genre} • {media.type}
										</span>
									</td>
									<td
										style={{
											padding: "15px 10px",
											fontSize: "0.9rem",
											color: "#ccc",
										}}
									>
										👁️ {media.views} | ❤️{" "}
										{media.likes?.length || 0} | 💬{" "}
										{media.comments?.length || 0}
									</td>
									<td
										style={{
											padding: "15px 10px",
											display: "flex",
											gap: "10px",
											flexWrap: "wrap",
										}}
									>
										<button
											onClick={() =>
												setExpandedComments(
													expandedComments ===
														media._id
														? null
														: media._id,
												)
											}
											style={{
												background: "#333",
												color: "white",
												border: "none",
												padding: "6px 12px",
												borderRadius: "6px",
												cursor: "pointer",
												fontSize: "0.8rem",
											}}
										>
											{expandedComments === media._id
												? "Close Comments"
												: "Moderate Comments"}
										</button>
										<button
											onClick={() =>
												handleDeleteMedia(media._id)
											}
											style={{
												background:
													"rgba(229, 9, 20, 0.2)",
												color: "#e50914",
												border: "1px solid #e50914",
												padding: "6px 12px",
												borderRadius: "6px",
												cursor: "pointer",
												fontSize: "0.8rem",
												fontWeight: "bold",
											}}
										>
											Delete Media
										</button>
									</td>
								</tr>

								{expandedComments === media._id && (
									<tr>
										<td
											colSpan="4"
											style={{
												padding: "20px",
												backgroundColor: "#0a0a0a",
											}}
										>
											<h4
												style={{
													color: "#aaa",
													margin: "0 0 15px 0",
												}}
											>
												Comment Moderation Log
											</h4>
											{media.comments.length === 0 ? (
												<p style={{ color: "#555" }}>
													No comments.
												</p>
											) : (
												<ul
													style={{
														listStyle: "none",
														padding: 0,
														margin: 0,
														display: "flex",
														flexDirection: "column",
														gap: "10px",
													}}
												>
													{media.comments.map((c) => (
														<li
															key={c.timestamp}
															style={{
																display: "flex",
																justifyContent:
																	"space-between",
																backgroundColor:
																	"#1a1a1a",
																padding: "10px",
																borderRadius:
																	"6px",
																border: "1px solid #333",
																flexWrap:
																	"wrap",
																gap: "10px",
															}}
														>
															<div>
																<strong
																	style={{
																		color: "#8b5cf6",
																	}}
																>
																	{c.username}
																</strong>
																<span
																	style={{
																		color: "#555",
																		fontSize:
																			"0.8rem",
																		marginLeft:
																			"10px",
																	}}
																>
																	[IP:{" "}
																	{c.ip ||
																		"Unknown"}
																	]
																</span>
																<p
																	style={{
																		margin: "5px 0 0 0",
																		fontSize:
																			"0.9rem",
																		color: "#ddd",
																	}}
																>
																	{c.text}
																</p>
															</div>
															<button
																onClick={() =>
																	handleDeleteComment(
																		media._id,
																		new Date(
																			c.timestamp,
																		).toISOString(),
																	)
																}
																style={{
																	background:
																		"transparent",
																	color: "#e50914",
																	border: "none",
																	cursor: "pointer",
																	fontSize:
																		"0.8rem",
																	textDecoration:
																		"underline",
																	alignSelf:
																		"flex-start",
																}}
															>
																Delete
															</button>
														</li>
													))}
												</ul>
											)}
										</td>
									</tr>
								)}
							</React.Fragment>
						))}
					</tbody>
				</table>
			</div>
		</div>
	);
}
