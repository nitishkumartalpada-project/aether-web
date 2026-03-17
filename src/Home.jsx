import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { getOrCreateGhostId } from "./utils/identity";

const formatCount = (num) => {
	return Intl.NumberFormat("en-US", {
		notation: "compact",
		maximumFractionDigits: 1,
	}).format(num || 0);
};

// Standardized Global Categories
const CATEGORIES = [
	"All",
	"Entertainment",
	"Tech",
	"Gaming",
	"Vlog",
	"Education",
];

export default function Home() {
	const [feed, setFeed] = useState([]);
	const [page, setPage] = useState(1);
	const [search, setSearch] = useState("");
	const [loading, setLoading] = useState(true);
	const [hasMore, setHasMore] = useState(true);

	const [activeGenre, setActiveGenre] = useState("All");
	const [activeSort, setActiveSort] = useState("recommended");

	const navigate = useNavigate();
	const ghostId = getOrCreateGhostId();

	const fetchFeed = async (
		pageNum = 1,
		searchQuery = search,
		genre = activeGenre,
		sort = activeSort,
		append = false,
	) => {
		try {
			setLoading(true);
			const res = await axios.get(
				`${import.meta.env.VITE_API_URL}/api/feed?page=${pageNum}&search=${searchQuery}&ghostId=${ghostId}&genre=${genre}&sort=${sort}`,
			);

			if (res.data.length < 6) setHasMore(false);
			else setHasMore(true);

			if (append) setFeed((prev) => [...prev, ...res.data]);
			else setFeed(res.data);

			setLoading(false);
		} catch (error) {
			console.error("Failed to fetch feed:", error);
			setLoading(false);
		}
	};

	useEffect(() => {
		fetchFeed(1, search, activeGenre, activeSort, false);
	}, [activeGenre, activeSort]);

	const handleSearch = (e) => {
		e.preventDefault();
		setPage(1);
		fetchFeed(1, search, activeGenre, activeSort, false);
	};

	const handleLoadMore = () => {
		const nextPage = page + 1;
		setPage(nextPage);
		fetchFeed(nextPage, search, activeGenre, activeSort, true);
	};

	return (
		<div className="page-container">
			{/* 1. Header & Search Row */}
			<div
				style={{
					display: "flex",
					justifyContent: "space-between",
					alignItems: "center",
					marginBottom: "15px",
					flexWrap: "wrap",
					gap: "15px",
				}}
			>
				<h2 className="section-title" style={{ margin: 0 }}>
					Global Feed
				</h2>
				<form
					onSubmit={handleSearch}
					style={{
						display: "flex",
						gap: "10px",
						width: "100%",
						maxWidth: "400px",
					}}
				>
					<input
						type="text"
						placeholder="Search the Aether..."
						value={search}
						onChange={(e) => setSearch(e.target.value)}
						style={{
							flexGrow: 1,
							padding: "10px 15px",
							borderRadius: "25px",
							border: "1px solid rgba(255,255,255,0.2)",
							background: "rgba(255,255,255,0.05)",
							color: "white",
							outline: "none",
						}}
					/>
					<button
						type="submit"
						style={{
							padding: "10px 20px",
							borderRadius: "25px",
							background: "#8b5cf6",
							color: "white",
							border: "none",
							fontWeight: "bold",
							cursor: "pointer",
						}}
					>
						Search
					</button>
				</form>
			</div>

			{/* 2. YouTube-Style Filter & Sort Bar */}
			<div
				style={{
					display: "flex",
					justifyContent: "space-between",
					alignItems: "center",
					marginBottom: "25px",
					gap: "15px",
					flexWrap: "wrap",
				}}
			>
				{/* Horizontally Scrollable Categories */}
				<div
					style={{
						display: "flex",
						gap: "10px",
						overflowX: "auto",
						paddingBottom: "5px",
						flexGrow: 1,
						WebkitOverflowScrolling: "touch",
						msOverflowStyle: "none",
						scrollbarWidth: "none",
					}}
					className="hide-scrollbar"
				>
					{CATEGORIES.map((cat) => (
						<button
							key={cat}
							onClick={() => {
								setPage(1);
								setActiveGenre(cat);
							}}
							style={{
								whiteSpace: "nowrap",
								padding: "8px 18px",
								borderRadius: "20px",
								fontWeight: "600",
								fontSize: "0.85rem",
								cursor: "pointer",
								transition: "0.2s",
								border:
									activeGenre === cat
										? "none"
										: "1px solid rgba(255,255,255,0.2)",
								backgroundColor:
									activeGenre === cat
										? "#8b5cf6"
										: "rgba(255,255,255,0.05)",
								color: "#ffffff",
							}}
						>
							{cat}
						</button>
					))}
				</div>

				{/* Sort Dropdown - Fixed Contrast */}
				<select
					value={activeSort}
					onChange={(e) => {
						setPage(1);
						setActiveSort(e.target.value);
					}}
					style={{
						padding: "8px 15px",
						borderRadius: "8px",
						background: "#1a1a1a",
						color: "white",
						border: "1px solid rgba(255,255,255,0.2)",
						outline: "none",
						fontWeight: "bold",
						cursor: "pointer",
					}}
				>
					<option
						value="recommended"
						style={{ background: "#1a1a1a", color: "white" }}
					>
						✨ AI Recommended
					</option>
					<option
						value="views"
						style={{ background: "#1a1a1a", color: "white" }}
					>
						🔥 Most Viewed
					</option>
					<option
						value="newest"
						style={{ background: "#1a1a1a", color: "white" }}
					>
						🕒 Newest
					</option>
				</select>
			</div>

			{feed.length === 0 && !loading ? (
				<p
					style={{
						color: "#aaa",
						textAlign: "center",
						marginTop: "50px",
					}}
				>
					No media found matching your query.
				</p>
			) : (
				<>
					<div className="video-grid">
						{feed.map((media) => (
							<div
								key={media._id}
								className="video-card"
								onClick={() =>
									navigate(`/play?id=${media._id}`)
								}
							>
								<img
									src={media.thumbnailUrl}
									alt={media.title}
									className="thumbnail"
								/>

								<div className="card-info">
									<h3
										style={{
											fontSize: "1.05rem",
											margin: "0 0 8px 0",
										}}
									>
										{media.title}
									</h3>
									<div
										style={{
											display: "flex",
											justifyContent: "space-between",
											alignItems: "center",
										}}
									>
										<span className="badge">
											{media.genre}
										</span>

										<div
											style={{
												display: "flex",
												gap: "15px",
												color: "#aaa",
												fontSize: "0.85rem",
												fontWeight: "600",
											}}
										>
											<span
												style={{
													display: "flex",
													alignItems: "center",
													gap: "4px",
												}}
											>
												👁️ {formatCount(media.views)}
											</span>
											<span
												style={{
													display: "flex",
													alignItems: "center",
													gap: "4px",
												}}
											>
												❤️{" "}
												{formatCount(
													media.likesCount ||
														media.likes?.length,
												)}
											</span>
										</div>
									</div>
								</div>
							</div>
						))}
					</div>

					{hasMore && (
						<div
							style={{
								display: "flex",
								justifyContent: "center",
								marginTop: "40px",
							}}
						>
							<button
								onClick={handleLoadMore}
								disabled={loading}
								style={{
									background: "transparent",
									border: "1px solid #8b5cf6",
									color: "#8b5cf6",
									padding: "12px 30px",
									borderRadius: "25px",
									fontWeight: "bold",
									cursor: loading ? "not-allowed" : "pointer",
									transition: "0.3s",
								}}
							>
								{loading ? "SYNCING..." : "LOAD MORE MEDIA"}
							</button>
						</div>
					)}
				</>
			)}

			<style>{`
        .hide-scrollbar::-webkit-scrollbar { display: none; }
      `}</style>
		</div>
	);
}
