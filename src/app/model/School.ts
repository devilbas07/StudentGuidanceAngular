import { DocumentReference } from '@angular/fire/firestore';

export class School {
    id?: string;
    ref?: DocumentReference;
    school_name: string = '';
}