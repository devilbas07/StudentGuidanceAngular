import { isNullOrUndefined } from "util";
import { Tcas } from "src/app/model/Tcas";
import { map } from "rxjs/operators";
import { AngularFirestore, DocumentReference } from "@angular/fire/firestore";
import { Injectable } from "@angular/core";
import { pipe } from "rxjs";

@Injectable({
  providedIn: "root",
})
export class TcasService {
  constructor(private firestore: AngularFirestore) {}

  getAllTcas() {
    return this.firestore
      .collectionGroup("Tcas", (query) => query.orderBy("round"))
      .snapshotChanges()
      .pipe(map((docs) => docs.map((item) => item.payload.doc)));
  }

  async getAllTcasUniversity(universityRef: DocumentReference) {
    let listTcas = new Array<Tcas>();

    const tcasSnapshot = await this.firestore
      .collectionGroup("Tcas")
      .get()
      .toPromise();

    const listTcasTemp = tcasSnapshot.docs
      .filter(
        (doc) =>
          doc.ref.parent.parent.parent.parent.parent.parent.id ==
          universityRef.id
      )
      .map((doc) => {
        return { id: doc.id, ref: doc.ref, ...(doc.data() as Tcas) };
      });

    //reduce duplicate tcas
    listTcasTemp.forEach((tcasTemp) => {
      if (!listTcas.find((tcas) => tcas.round == tcasTemp.round)) {
        listTcas.push(tcasTemp);
      }
    });
    return listTcas;
  }

  getTcasByMajorReference(majorRef: DocumentReference) {
    return this.firestore
      .collection(majorRef.parent.path)
      .doc(majorRef.id)
      .collection("Tcas", (query) => query.orderBy("round"))
      .get()
      .pipe(map((docs) => docs.docs.map((item) => item)));
  }

  getTcasByMajorReferenceRealtime(majorRef: DocumentReference) {
    return this.firestore
      .collection(majorRef.parent.path)
      .doc(majorRef.id)
      .collection("Tcas", (query) => query.orderBy("round"))
      .snapshotChanges()
      .pipe(map((docs) => docs.map((item) => item.payload.doc)));
  }

  async addTcas(majorRef: DocumentReference, tcas: Tcas) {
    delete tcas.id;
    delete tcas.ref;
    try {
      await this.firestore
        .collection(majorRef.parent)
        .doc(majorRef.id)
        .collection("Tcas", (query) =>
          query.where("majorName", "==", tcas.round)
        )
        .get()
        .toPromise()
        .then(async (result) => {
          if (!result.empty) throw new Error("มี TCAS รอบนี้อยู่ในระบบแล้ว");
          await this.firestore
            .collection(majorRef.parent)
            .doc(majorRef.id)
            .collection("Tcas")
            .add(Object.assign({}, tcas));
        });
    } catch (error) {
      console.error(error);
      if (error.message == "มี TCAS รอบนี้อยู่ในระบบแล้ว") {
        throw error;
      } else {
        throw new Error("เกิดข้อผิดพลาด กรุณาลองใหม่อีกครั้งภายหลัง");
      }
    }
  }

  async updateTcas(tcasRef: DocumentReference, tcas: Tcas) {
    const batch = this.firestore.firestore.batch();
    try {
      batch.set(tcasRef, Object.assign({}, tcas));
      await batch.commit();
    } catch (error) {
      console.error(error);
      throw new Error("เกิดข้อผิดพลาด กรุณาลองใหม่อีกครั้งภายหลัง");
    }
  }
}
