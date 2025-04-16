import ReactDOM from "react-dom/client";
import "./index.css";
import { Editor, type OnMount } from "@monaco-editor/react";
import { useEffect, useRef, useState } from "react";
import { Terminal, BookOpen } from "lucide-react";
import pkg from "../package.json";
const version = pkg.version;

function App() {
	type IStandaloneCodeEditor = Parameters<OnMount>[0];

	const monacoRef = useRef<IStandaloneCodeEditor | null>(null);
	const [wikiOpen, setWikiOpen] = useState(false);

	const toggleWiki = () => setWikiOpen((prev) => !prev);

	const [readmeHtml, setReadmeHtml] = useState("");

	useEffect(() => {
		try{
			fetch("https://raw.githubusercontent.com/jacopo-angeli/software-verififcation-project/refs/heads/main/docs/README.md")
			.then((res) => res.text())
			.then((markdown) => {
				// Optional: only if your README is in HTML
				setReadmeHtml(markdown);
			});
		} catch (e){
			console.log(e)
		}
	  }, []);

	return (
		<div className="h-screen flex flex-col">
			{/* Header */}
			<header className="w-full bg-[#1e1e1e] text-white px-6 py-4 flex items-center justify-between z-50">
				{/* Logo */}
				<div className="flex flex-col items-start">
					<h1 className="text-3xl font-semibold leading-tight tracking-tight" style={{ fontFamily: "Anton" }}>
						Abstract Interpreter
					</h1>
					<p className="text-sm text-gray-300 mt-1 font-light" style={{ fontFamily: "Anton" }}>
						Accademic project - Software verification course - A.Y. 24-25
					</p>
				</div>

				{/* Command Palette and Wiki Buttons */}
				<div className="flex items-center gap-4">
					<button
						onClick={() => {
							monacoRef.current?.focus();
							monacoRef.current?.trigger("keyboard", "editor.action.quickCommand", {
								initialSearch: "Initial search term",
							});
						}}
						className="p-2 rounded-md bg-[#2e2e2e] hover:bg-[#3a3a3a] focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-white transition-colors"
						aria-label="Open command palette"
						title="Open the command palette"
					>
						<Terminal className="w-5 h-5" aria-hidden="true" />
						<span className="sr-only">Command Palette</span>
					</button>

					<button onClick={toggleWiki} className="p-2 rounded-md bg-[#2e2e2e] hover:bg-[#3a3a3a] focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-white transition-colors" aria-label="Toggle wiki sidebar" title="Toggle wiki sidebar">
						<BookOpen className="w-5 h-5" aria-hidden="true" />
						<span className="sr-only">Toggle Wiki Sidebar</span>
					</button>
				</div>
			</header>

			{/* Wiki Sidebar */}
			<aside className={`fixed top-0 left-0 h-full w-[90vw] max-w-[800px] bg-[#1e1e1e] text-white shadow-lg z-50 transform transition-transform duration-300 ${wikiOpen ? "translate-x-0" : "-translate-x-full"}`}>
				<div className="p-6 overflow-y-auto h-full" dangerouslySetInnerHTML={{ __html: readmeHtml }} />
			</aside>

			{/* Monaco Editor */}
			<Editor
				height="100%"
				width="100%"
				theme="vs-dark"
				value={"test"}
				onMount={(editor, monaco) => {
					monacoRef.current = editor;

					// Custom Command: Run Code
					editor.addAction({
						id: "run-code",
						label: "Run Code",
						contextMenuOrder: 2,
						contextMenuGroupId: "1_modification",
						keybindings: [monaco.KeyMod.CtrlCmd | monaco.KeyCode.Enter],
						run: () => {
							console.log("ciao");
						},
					});

					// Custom Command: Toggle Wiki
					editor.addAction({
						id: "toggle-wiki",
						label: "Toggle Wiki Sidebar",
						contextMenuOrder: 3,
						contextMenuGroupId: "navigation",
						run: () => {
							toggleWiki();
						},
					});
				}}
			/>

			{/* Footer */}
			<footer className="w-full bg-[#1e1e1e] text-white py-4 px-6 mt-auto flex items-center justify-between">
				<p className="text-sm font-semibold" style={{ fontFamily: "Anton" }}>
					v{version}
				</p>

				<a
					href="https://github.com/jacopo-angeli/software-verififcation-project" // replace with your actual GitHub repo link
					target="_blank"
					rel="noopener noreferrer"
					className="text-sm font-semibold hover:underline flex items-center gap-2"
					style={{ fontFamily: "Anton" }}
					aria-label="View on GitHub"
				>
					<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="currentColor" className="text-white" viewBox="0 0 16 16">
						<path d="M8 0C3.58 0 0 3.58 0 8a8 8 0 0 0 5.47 7.59c.4.07.55-.17.55-.38v-1.3c-2.23.49-2.7-1.08-2.7-1.08-.36-.91-.88-1.15-.88-1.15-.72-.5.05-.49.05-.49.8.06 1.22.83 1.22.83.71 1.22 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.01.08-2.1 0 0 .67-.22 2.2.82a7.65 7.65 0 0 1 2.01-.27c.68.003 1.37.092 2.01.27 1.53-1.04 2.2-.82 2.2-.82.44 1.09.16 1.9.08 2.1.51.56.82 1.28.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48v2.2c0 .21.15.46.55.38A8.01 8.01 0 0 0 16 8c0-4.42-3.58-8-8-8z" />
					</svg>
					<span className="hidden sm:inline">GitHub</span>
				</a>
			</footer>
		</div>
	);
}

const root = ReactDOM.createRoot(document.getElementById("root") as HTMLElement);
root.render(<App />);
