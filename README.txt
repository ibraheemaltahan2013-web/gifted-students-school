gifted students school - Communication Platform
 ==============================================

 PROJECT STRUCTURE:
 ----------------
 giftied students school/
   ├── public/              # Static files (HTML, CSS, JS)
   │   └── index.html       # Main application interface
   ├── server.js            # Node.js server (optional)
   └── run.bat              # Batch file to start server + open browser

 QUICK START (NO SERVER NEEDED):
 ------------------------------
 1. Double-click "public/index.html" to open in your browser
 2. Or right-click → Open with → Chrome/Firefox/Edge
 
 The application works fully as a standalone HTML file.
 No installation or setup required.

 FEATURES:
 --------
 ✅ Student/Teacher role selection
 ✅ Arabic interface
 ✅ Message sending between roles
 ✅ Responsive design (works on mobile/desktop)
 ✅ Sample messages for demonstration

 FULL FEATURES WITH SERVER:
 -------------------------
 If you want the server running (for message persistence and advanced features):

 1. Ensure Node.js is installed: https://nodejs.org/
 2. Open terminal/command prompt
 3. Navigate to: cd "C:\Users\user\OneDrive\Desktop\gifted students school"
 4. Run: node server.js
 5. Open browser to: http://localhost:3000

 The server provides:
 - HTTP hosting of the application
 - Message storage in memory (reset on server restart)
 - Better error handling

 TROUBLESHOOTING:
 ---------------
 If "Site can't be reached" error:
   - Make sure the server is running (you should see "Server running on port 3000")
   - Try: http://127.0.0.1:3000 instead of localhost
   - Check if port 3000 is blocked by firewall
   - Restart the server process

 FILES:
 ------
 - public/index.html: Main application (open directly in browser)
 - server.js: Node.js server (run with "node server.js")
 - run.bat: Double-click to start server and open browser automatically

 For any issues, ensure you have:
 - Windows 10/11
 - Modern browser (Chrome, Firefox, Edge, Safari)
 - Node.js (only needed for server mode)