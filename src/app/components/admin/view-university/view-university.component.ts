import { EditTcasUniversityDialogComponent } from "./dialog/list-major-dialog/dialog/edit-tcas/edit-tcas-university/edit-tcas-university-dialog/edit-tcas-university-dialog.component";
import { Component, OnInit, ViewChild, AfterViewInit } from "@angular/core";
import { University } from "src/app/model/University";
import { UniversityService } from "src/app/services/university-service/university.service";
import { ActivatedRoute, Router } from "@angular/router";
import { Faculty } from "src/app/model/Faculty";
import {
  MatTableDataSource,
  MatPaginator,
  MatDialog,
  MatPaginatorIntl,
} from "@angular/material";
import {
  trigger,
  state,
  style,
  transition,
  animate,
} from "@angular/animations";
import { AddEditFacultyDialogComponent } from "./dialog/add-edit-faculty-dialog/add-edit-faculty-dialog.component";
import { FacultyService } from "src/app/services/faculty-service/faculty.service";
import { AddMajorDialogComponent } from "./dialog/add-major-dialog/add-major-dialog.component";
import { EditUniversityDialogComponent } from "./dialog/edit-university-dialog/edit-university-dialog.component";
import {
  QueryDocumentSnapshot,
  DocumentReference,
  DocumentData,
} from "@angular/fire/firestore";
import { AngularFireStorage } from "@angular/fire/storage";
import { ListMajorAdminDialogComponent } from "./dialog/list-major-dialog/list-major-dialog.component";
import { ConfirmDialogComponent } from "../../util/confirm-dialog/confirm-dialog.component";
import { Notifications } from "../../util/notification";
import { NgxSpinnerService } from "ngx-spinner";

@Component({
  selector: "app-view-university",
  templateUrl: "./view-university.component.html",
  styleUrls: ["./view-university.component.css"],
  animations: [
    trigger("detailExpand", [
      state("collapsed", style({ height: "0px", minHeight: "0" })),
      state("expanded", style({ height: "*" })),
      transition(
        "expanded <=> collapsed",
        animate("225ms cubic-bezier(0.4, 0.0, 0.2, 1)")
      ),
    ]),
  ],
})
export class ViewUniversityComponent implements OnInit, AfterViewInit {
  university: University = new University();
  university_id;

  universityImg: string = "assets/img/no-photo-available.png";

  showContent: boolean = false;
  showTable: boolean = false;

  facultyLtb: MatTableDataSource<Faculty>;
  displayedColumns: string[] = ["faculty_name", "url", "major", "manage"];
  @ViewChild(MatPaginator, { static: false }) paginator: MatPaginator;
  paginatorInit = new MatPaginatorIntl();

  constructor(
    private universityService: UniversityService,
    private facultyService: FacultyService,
    public dialog: MatDialog,
    private activeRoute: ActivatedRoute,
    private router: Router,
    private afStorage: AngularFireStorage,
    private spinner: NgxSpinnerService
  ) {}

  ngOnInit() {
    this.spinner.show();
    setTimeout(() => {
      this.spinner.hide();
    }, 3000);

    this.university_id = this.activeRoute.snapshot.paramMap.get("university");
    if (this.university_id === null) {
      window.location.replace("/admin");
    }
    this.getUniversity(this.university_id);
    this.getFaculty(this.university_id);
  }

  ngAfterViewInit() {
    this.customTextPaginator();
    this.paginator._intl = this.paginatorInit;
    this.customFilter();
  }

  private customFilter() {
    this.facultyLtb.filterPredicate = (data: Faculty, filter: string) => {
      if (
        data.faculty_name.indexOf(filter) != -1 ||
        data.url.indexOf(filter) != -1
      ) {
        return true;
      }
      return false;
    };
  }

  private customTextPaginator() {
    //custom text paginator
    this.paginatorInit.getRangeLabel = (
      page: number,
      pageSize: number,
      length: number
    ) => {
      if (length === 0 || pageSize === 0) {
        return `0 จากทั้งหมด ${length}`;
      }
      length = Math.max(length, 0);
      const startIndex = page * pageSize;
      const endIndex =
        startIndex < length
          ? Math.min(startIndex + pageSize, length)
          : startIndex + pageSize;
      return `${startIndex + 1} - ${endIndex} จากทั้งหมด ${length}`;
    };
    this.paginatorInit.changes.next();
  }

  private getUniversity(university_id: string) {
    this.universityService
      .getUniversity(university_id)
      .subscribe(async (universityRes) => {
        this.university = universityRes.payload.data() as University;
        if (this.university.image === undefined || this.university.image == "")
          return;

        this.afStorage.storage
          .ref(this.university.image)
          .getDownloadURL()
          .then((url) => {
            this.universityImg = url;
          });

        if (undefined === this.university) {
          this.showContent = false;
        } else {
          this.showContent = true;
          this.spinner.hide();
        }
      });
  }

  private getFaculty(university_id: string) {
    this.facultyLtb = new MatTableDataSource<Faculty>();
    this.facultyService
      .getFacultyByUniversityId(university_id)
      .subscribe((docs) => {
        this.facultyLtb.data = docs.map((item) => {
          return {
            id: item.id,
            ref: item.ref,
            ...(item.data() as Faculty),
          };
        });
        this.facultyLtb.paginator = this.paginator;
        if (this.facultyLtb.data.length === 0) {
          this.showTable = false;
        } else {
          this.showTable = true;
        }
      });
  }

  applyFilter(filterValue: string) {
    this.facultyLtb.filter = filterValue.trim().toLowerCase();
  }

  openEditTcasUniversityDialog(): void {
    const dialogRef = this.dialog.open(EditTcasUniversityDialogComponent, {
      width: "90%",
      height: "90%",
      data: {},
    });

    dialogRef.afterClosed().subscribe((universityRs) => {
      this.universityService.updateUniversity(this.university_id, universityRs);
    });
  }

  openEditUniversityDialog(): void {
    const dialogRef = this.dialog.open(EditUniversityDialogComponent, {
      width: "90%",
      height: "90%",
      data: { universityId: this.university_id, university: this.university },
    });

    dialogRef.afterClosed().subscribe((universityRs) => {
      this.universityService.updateUniversity(this.university_id, universityRs);
    });
  }

  openDeleteUniversityDialog() {
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      width: "auto",
      data: `คุณต้องการลบข้อมูล${this.university.university_name} ใช่ หรือ ไม่ ?`,
    });

    dialogRef.afterClosed().subscribe(async (result) => {
      try {
        if (result) {
          this.universityService.deleteUniversity(this.university_id);
          new Notifications().showNotification(
            "done",
            "top",
            "right",
            "ลบข้อมูลมหาวิทยาลัยสำเร็จแล้ว",
            "success",
            "สำเร็จ !"
          );
          this.router.navigate(["/admin/list-university/"]);
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

  openAddMajorDialog(facultyRef: DocumentReference) {
    const dialogRef = this.dialog.open(AddMajorDialogComponent, {
      width: "90%",
      data: facultyRef,
    });

    dialogRef.afterClosed().subscribe();
  }

  openAddEditFacultyDialog(faculty?: Faculty): void {
    const dialogRef = this.dialog.open(AddEditFacultyDialogComponent, {
      width: "90%",
      data: faculty ? faculty : null,
    });

    dialogRef.afterClosed().subscribe(async (facultyRs) => {
      try {
        if (facultyRs === null || facultyRs === undefined) return;
        if (facultyRs.mode === "เพิ่ม") {
          await this.facultyService.addFaculty(
            this.university_id,
            facultyRs.faculty
          );
          new Notifications().showNotification(
            "done",
            "top",
            "right",
            "เพิ่มข้อมูลคณะสำเร็จแล้ว",
            "success",
            "สำเร็จ !"
          );
        } else if (facultyRs.mode === "แก้ไข") {
          await this.facultyService.updateFaculty(
            faculty.ref,
            facultyRs.faculty
          );
          new Notifications().showNotification(
            "done",
            "top",
            "right",
            "แก้ไขข้อมูลคณะสำเร็จแล้ว",
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
          "จัดการข้อมูลล้มเหลว !"
        );
      }
    });
  }

  openDeleteFacultyDialog(faculty: Faculty) {
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      width: "auto",
      data: `คุณต้องการลบข้อมูลคณะ${faculty.faculty_name} ใช่ หรือ ไม่ ?`,
    });

    dialogRef.afterClosed().subscribe(async (result) => {
      try {
        if (result) {
          await this.facultyService.deleteFaculty(faculty.ref);
          new Notifications().showNotification(
            "done",
            "top",
            "right",
            "ลบข้อมูลคณะสำเร็จแล้ว",
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

  openListMajorDialog(faculty: DocumentReference) {
    const dialogRef = this.dialog.open(ListMajorAdminDialogComponent, {
      width: "90%",
      maxHeight: "90%",
      data: faculty,
    });

    dialogRef.afterClosed();
  }
}
