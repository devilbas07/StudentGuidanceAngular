import { Component, Inject, OnDestroy, OnInit } from "@angular/core";
import { DocumentReference } from "@angular/fire/firestore";
import { MatDialog, MatDialogRef, MAT_DIALOG_DATA } from "@angular/material";
import { NgxSpinnerService } from "ngx-spinner";
import { Subscription } from "rxjs";
import { ConfirmDialogComponent } from "src/app/components/util/confirm-dialog/confirm-dialog.component";
import { Notifications } from "src/app/components/util/notification";
import { Major } from "src/app/model/Major";
import { MajorService } from "src/app/services/major-service/major.service";
import { Tcas } from "./../../../../../model/Tcas";
import { TcasService } from "./../../../../../services/tcas-service/tcas.service";
import { EditMajorComponent } from "./dialog/edit-major/edit-major.component";
import { EditTcasMajorComponent } from "./dialog/edit-tcas/edit-tcas-major/edit-tcas-major.component";

@Component({
  selector: "app-list-major-dialog",
  templateUrl: "./list-major-dialog.component.html",
  styleUrls: ["./list-major-dialog.component.css"],
})
export class ListMajorAdminDialogComponent implements OnInit, OnDestroy {
  listMajor = new Array<Major>();
  haveCareer = false;
  showData = false;

  majorSub: Subscription;

  constructor(
    private majorService: MajorService,
    private tcasService: TcasService,
    public dialog: MatDialog,
    public dialogRef: MatDialogRef<ListMajorAdminDialogComponent>,
    private spinner: NgxSpinnerService,
    @Inject(MAT_DIALOG_DATA) public data: DocumentReference
  ) {}

  async ngOnInit() {
    this.spinner.show();
    setTimeout(() => {
      this.spinner.hide();
    }, 3000);

    this.majorSub = this.majorService
      .getMajorByFacultyReference(this.data)
      .subscribe((majorDocs) => {
        this.listMajor = majorDocs.map((docs) => {
          return { id: docs.id, ref: docs.ref, ...(docs.data() as Major) };
        });

        if (this.listMajor === undefined || this.listMajor.length === 0) {
          this.showData = false;
          this.dialogRef.updateSize("90%", "auto");
        } else {
          this.spinner.hide();
          this.showData = true;
          this.dialogRef.updateSize("90%", "90%");
        }
      });
  }

  ngOnDestroy(): void {
    this.majorSub.unsubscribe();
  }

  openEditMajorDialog(major: Major): void {
    const dialogRef = this.dialog.open(EditMajorComponent, {
      width: "90%",
      maxHeight: "90%",
      data: major,
    });
    dialogRef.afterClosed().subscribe(async (newMajor) => {
      try {
        if (!newMajor) return;
        this.majorSub.unsubscribe();
        await this.majorService.updateMajor(major.ref, newMajor);
        new Notifications().showNotification(
          "done",
          "top",
          "right",
          "แก้ไขข้อมูลสาขาสำเร็จแล้ว",
          "success",
          "สำเร็จ !"
        );
      } catch (error) {
        this.majorSub.unsubscribe();
        new Notifications().showNotification(
          "close",
          "top",
          "right",
          error.message,
          "danger",
          "แก้ไขข้อมูลล้มเหลว !"
        );
      }
    });
  }

  openEditTcasDialog(major: Major): void {
    const dialogRef = this.dialog.open(EditTcasMajorComponent, {
      width: "90%",
      height: "auto",
      data: {
        major: major,
        universityRef: major.ref.parent.parent.parent.parent,
      },
    });
    dialogRef
      .afterClosed()
      .subscribe(async (result: { tcas: Tcas; mode: string }) => {
        try {
          if (!result) {
            return;
          } else if (result.mode == "add") {
            await this.tcasService.addTcas(major.ref, result.tcas);
          } else if (result.mode == "edit") {
            this.tcasService.updateTcas(result.tcas.ref, result.tcas);
          }
          new Notifications().showNotification(
            "done",
            "top",
            "right",
            "บันทึกข้อมูลสาขาสำเร็จแล้ว",
            "success",
            "สำเร็จ !"
          );
        } catch (error) {
          new Notifications().showNotification(
            "close",
            "top",
            "right",
            error.message,
            "danger",
            "บันทึกข้อมูลล้มเหลว !"
          );
        }
      });
  }

  onDelete(major: Major) {
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      width: "auto",
      data: `คุณต้องการลบข้อมูลสาขา${major.majorName} ใช่ หรือ ไม่ ?`,
    });

    dialogRef.afterClosed().subscribe(async (result) => {
      try {
        if (result) {
          await this.majorService.deleteMajor(major.ref);
          new Notifications().showNotification(
            "done",
            "top",
            "right",
            "ลบข้อมูลสาขาสำเร็จแล้ว",
            "success",
            "สำเร็จ !"
          );
        }
      } catch (error) {
        new Notifications().showNotification(
          "close",
          "top",
          "right",
          error.message,
          "danger",
          "ลบข้อมูลล้มเหลว !"
        );
      }
    });
  }

  onNoClick(): void {
    this.dialogRef.close();
  }
}
