<script type="module">
  // Import the functions you need from the SDKs you need
  import { initializeApp } from "https://www.gstatic.com/firebasejs/13.1.0/firebase-app.js";
  import { getAnalytics } from "https://www.gstatic.com/firebasejs/13.1.0/firebase-analytics.js";
  // TODO: Add SDKs for Firebase products that you want to use
  // https://firebase.google.com/docs/web/setup#available-libraries

  // Your web app's Firebase configuration
  // For Firebase JS SDK v7.20.0 and later, measurementId is optional
  const firebaseConfig = {
    apiKey: "AIzaSyAOe9aMUozLEUnj-I8fdg9pgTuG9iM2gNM",
    authDomain: "voting-app-c0e4f.firebaseapp.com",
    projectId: "voting-app-c0e4f",
    storageBucket: "voting-app-c0e4f.firebasestorage.app",
    messagingSenderId: "1063274263693",
    appId: "1:1063274263693:web:6e4f9813380fd652615ec4",
    measurementId: "G-P1XDHVGR5S"
  };

  // Initialize Firebase
  const app = initializeApp(firebaseConfig);
  const analytics = getAnalytics(app);
</script>
