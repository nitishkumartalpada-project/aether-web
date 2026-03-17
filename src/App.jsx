import { BrowserRouter as Router, Routes, Route, Link } from "react-router-dom";
import Home from "./Home";
import Player from "./Player";
import Shorts from "./Shorts";
import Upload from "./Upload";
import Admin from "./Admin";
import About from "./About"; // NEW IMPORT

export default function App() {
	return (
		<Router>
			<nav className="navbar">
				{/* Clickable Logo returns to Feed */}
				<Link to="/" style={{ textDecoration: "none" }}>
					<h1 className="logo">
						AETHER<span style={{ color: "#8b5cf6" }}>.</span>
					</h1>
				</Link>

				<div className="nav-links">
					<Link to="/" className="nav-item">
						Feed
					</Link>
					<Link to="/shorts" className="nav-item">
						Shorts
					</Link>
					<Link
						to="/about"
						className="nav-item"
						style={{ color: "#aaa" }}
					>
						About
					</Link>{" "}
					{/* NEW LINK */}
					<Link
						to="/upload"
						className="nav-item"
						style={{ color: "#8b5cf6", fontWeight: "bold" }}
					>
						+ INGEST
					</Link>
				</div>
			</nav>

			<Routes>
				<Route path="/" element={<Home />} />
				<Route path="/play" element={<Player />} />
				<Route path="/shorts" element={<Shorts />} />
				<Route path="/upload" element={<Upload />} />
				<Route path="/admin" element={<Admin />} />
				<Route path="/about" element={<About />} /> {/* NEW ROUTE */}
			</Routes>
		</Router>
	);
}
