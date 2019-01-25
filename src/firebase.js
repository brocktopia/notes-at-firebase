import firebase from 'firebase/app'
import 'firebase/auth'
import 'firebase/firestore'
import 'firebase/storage'
import firebaseConfig from "@/firebase-config";

export default firebase.initializeApp(firebaseConfig)
