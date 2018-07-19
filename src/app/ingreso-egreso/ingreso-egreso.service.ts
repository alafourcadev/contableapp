import {Injectable} from '@angular/core';
import {AngularFirestore} from 'angularfire2/firestore';
import {IngresoEgreso} from './ingreso-egreso.model';
import {AuthService} from '../auth/auth.service';
import {Subscription} from 'rxjs';
import {filter, map} from 'rxjs/operators';
import {AppState} from '../app.reducer';
import {Store} from '@ngrx/store';
import {SetItemsAction, UnsetItemsAction} from './ingreso-egreso.actions';

@Injectable({
  providedIn: 'root'
})
export class IngresoEgresoService {

  ingresoEgresoListerSubcription: Subscription = new Subscription();
  ingresoEgresoItemsSubcription: Subscription = new Subscription();

  constructor(private afDB: AngularFirestore,
              public authService: AuthService,
              private store: Store<AppState>) {
  }


  private ingresoEgresoItems(uid: string) {

    this.ingresoEgresoItemsSubcription = this.afDB.collection(`${ uid }/ingresos-egresos/items`)
      .snapshotChanges()
      .pipe(
        map(docData => {

          return docData.map(doc => {
            return {
              uid: doc.payload.doc.id,
              ...doc.payload.doc.data()
            };
          });

        })
      )
      .subscribe((coleccion: any[]) => {

        this.store.dispatch(new SetItemsAction(coleccion));

      });


  }


  initIngresoEgresoListener() {

    this.ingresoEgresoListerSubcription = this.store.select('auth')
      .pipe(
        filter(auth => auth.user != null)
      )
      .subscribe(auth =>
        this.ingresoEgresoItems(auth.user.uid)
      );

  }


  cancelarSubscriptions() {
    this.ingresoEgresoListerSubcription.unsubscribe();
    this.ingresoEgresoItemsSubcription.unsubscribe();
    this.store.dispatch(new UnsetItemsAction());
  }


  crearIngresoEgreso(ingresoEgreso: IngresoEgreso) {

    const user = this.authService.getUsuario();

    console.log(user);

    return this.afDB.doc(`${ user.uid }/ingresos-egresos`)
      .collection('items').add({...ingresoEgreso});
  }


  borrarIngresoEgreso(uid: string) {

    const user = this.authService.getUsuario();

    return this.afDB.doc(`${ user.uid }/ingresos-egresos/items/${ uid }`)
      .delete();

  }


}
