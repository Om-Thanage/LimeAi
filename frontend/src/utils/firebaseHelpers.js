import { db } from '../config/firebase';
import { collection, addDoc, serverTimestamp, query, where, orderBy, limit, getDocs, Timestamp } from 'firebase/firestore';

export const saveContentToFirestore = async (userId, title, content, type) => {
  try {
    const contentRef = collection(db, 'userContent');
    const docData = {
      userId,
      title,
      content,
      type,
      createdAt: serverTimestamp()
    };
    
    const docRef = await addDoc(contentRef, docData);
    return { id: docRef.id, ...docData };
  } catch (error) {
    console.error('Error saving content to Firestore:', error);
    throw error;
  }
};

export const getRecentActivities = async (userId, activityLimit = 5) => {
  try {
    const contentRef = collection(db, 'userContent');
    try {
      const simpleQuery = query(
        contentRef, 
        where('userId', '==', userId),
        limit(activityLimit * 2)
      );
      
      const querySnapshot = await getDocs(simpleQuery);
      const activities = [];
      
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        let createdAt = new Date();
        
        if (data.createdAt) {
          if (data.createdAt instanceof Timestamp) {
            createdAt = data.createdAt.toDate();
          } else if (data.createdAt.seconds) {
            createdAt = new Date(data.createdAt.seconds * 1000);
          }
        }
        
        activities.push({
          id: doc.id,
          ...data,
          createdAt
        });
      });
      
      
      return activities
        .sort((a, b) => b.createdAt - a.createdAt)
        .slice(0, activityLimit);
    } catch (simpleQueryError) {
      console.warn('Simple query failed, attempting with index', simpleQueryError);
      
      
      
      
      const indexedQuery = query(
        contentRef, 
        where('userId', '==', userId),
        orderBy('createdAt', 'desc'),
        limit(activityLimit)
      );
      
      const querySnapshot = await getDocs(indexedQuery);
      const activities = [];
      
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        let createdAt = new Date();
        
        if (data.createdAt) {
          if (data.createdAt instanceof Timestamp) {
            createdAt = data.createdAt.toDate();
          } else if (data.createdAt.seconds) {
            createdAt = new Date(data.createdAt.seconds * 1000);
          }
        }
        
        activities.push({
          id: doc.id,
          ...data,
          createdAt
        });
      });
      
      return activities;
    }
  } catch (error) {
    console.error('Error fetching recent activities:', error);
    return [];
  }
};
