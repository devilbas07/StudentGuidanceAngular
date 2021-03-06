import { Alumni } from "./../../model/Alumni";
import { Injectable } from "@angular/core";
import { AngularFirestore, DocumentReference } from "@angular/fire/firestore";
import { Student } from "src/app/model/Student";
import { map } from "rxjs/operators";

@Injectable({
  providedIn: "root",
})
export class AlumniService {
  constructor(private firestore: AngularFirestore) {}

  getAlumniBySchoolReference(school: DocumentReference) {
    return this.firestore
      .collection(school.parent.path)
      .doc(school.id)
      .collection("Student", (query) => query.orderBy("firstname"))
      .snapshotChanges()
      .pipe(
        map((result) => {
          return result
            .filter(
              (item) =>
                (item.payload.doc.data() as Student).student_status !==
                "กำลังศึกษา"
            )
            .map((item) => {
              return {
                id: item.payload.doc.id,
                ref: item.payload.doc.ref,
                ...item.payload.doc.data(),
              } as Student;
            });
        })
      );
  }

  getAlumniByGraduateYear(schoolName: string, year: string) {
    return this.firestore
      .collectionGroup("Alumni", (query) =>
        query
          .where("schoolName", "==", schoolName)
          .where("graduate_year", "==", year)
      )
      .snapshotChanges()
      .pipe(
        map((result) =>
          result.map((item) => {
            return {
              id: item.payload.doc.id,
              ref: item.payload.doc.ref,
              ...(item.payload.doc.data() as Alumni),
            } as Alumni;
          })
        )
      );
  }
}
