import { Injectable } from '@angular/core';
import { AngularFirestore, DocumentReference, QueryGroupFn } from '@angular/fire/firestore';
import { Student } from 'src/app/model/Student';
import { Login } from 'src/app/model/Login';
import { map } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class StudentService {
  constructor(
    private firestore: AngularFirestore,
  ) {
  }

  getStudentBySchoolReference(school: DocumentReference) {
    return this.firestore.collectionGroup('School', query => query.where('school_name', '==', school.id)
      .orderBy('firstname'))
      .snapshotChanges()
      .pipe(
        map(result => result.filter(item => (item.payload.doc.data() as Student).student_status === 'กำลังศึกษา')
          .map(item => item.payload.doc)));
  }

  getStudentByStudentId(studentId: string) {
    return this.firestore.collection('Student').doc(studentId).snapshotChanges();
  }

  getStudentByCondition(queryGroupFn: QueryGroupFn) {
    return this.firestore.collectionGroup('Student', queryGroupFn).snapshotChanges();
  }

  updateStudent(studentRef: DocumentReference, student: Student) {
    return this.firestore.collection(studentRef.parent).doc(studentRef.id).update(Object.assign({}, student));
  }

  addStudent(login: Login, student: Student) {
    this.firestore.collection('Student').doc(login.username).set(Object.assign({}, student)).then(() => {
    });
  }
}
