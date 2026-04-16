import { Component, Host, h } from '@stencil/core';
import '@material/web/list/list'
import '@material/web/list/list-item'
import '@material/web/icon/icon'

@Component({
  tag: 'mglm-sample-and-diagnosis-test-list',
  styleUrl: 'mglm-sample-and-diagnosis-test-list.css',
  shadow: true,
})
export class MglmSampleAndDiagnosisTestList {
  // TODO might change later
  waitingPatients: any[];

  private async getWaitingPatientsAsync(){
    return await Promise.resolve(
      [{
          name: 'Jožko Púčik',
          patientId: '10001',
          estimatedStart: new Date(Date.now() + 65 * 60),
          estimatedDurationMinutes: 15,
          condition: 'Kontrola'
      }, {
          name: 'Bc. August Cézar',
          patientId: '10096',
          estimatedStart: new Date(Date.now() + 30 * 60),
          estimatedDurationMinutes: 20,
          condition: 'Teploty'
      }, {
          name: 'Ing. Ferdinand Trety',
          patientId: '10028',
          estimatedStart: new Date(Date.now() + 5 * 60),
          estimatedDurationMinutes: 15,
          condition: 'Bolesti hrdla'
      }]
    );
  }

  async componentWillLoad() {
    this.waitingPatients = await this.getWaitingPatientsAsync();
  }
  // TODO might change later

  render() {
    return (
      <Host>
        <md-list>
          {this.waitingPatients.map(patient =>
            <md-list-item>
              <div slot="headline">{patient.name}</div>
              <div slot="supporting-text">{"Predpokladaný vstup: " + patient.estimatedStart?.toLocaleString()}</div>
                <md-icon slot="start">person</md-icon>
            </md-list-item>
          )}
        </md-list>
      </Host>
    );
  }
}
