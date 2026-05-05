import { Component, Event, EventEmitter,  Host, Prop, State, h } from '@stencil/core';
import { SampleAndDiagnosisTestListApi, TestListEntry, Configuration } from '../../api/sample-and-diagnosis-test';

@Component({
  tag: 'mglm-sample-and-diagnosis-test-list',
  styleUrl: 'mglm-sample-and-diagnosis-test-list.css',
  shadow: true,
})
export class MglmSampleAndDiagnosisTestList {
  @Event({ eventName: "entry-clicked"}) entryClicked: EventEmitter<string>;
  @Prop() apiBase: string;
  @Prop() sampleAndDiagnosisId: string;
  @State() errorMessage: string;

  // TODO might change later
  waitingPatients: TestListEntry[];

  private async getWaitingPatientsAsync(): Promise<TestListEntry[]>{
    // be prepared for connectivitiy issues
    try {
      const configuration = new Configuration({
        basePath: this.apiBase,
      });

      const testListApi = new SampleAndDiagnosisTestListApi(configuration);
      const response = await testListApi.getTestListEntriesRaw({sampleAndDiagnosisId: this.sampleAndDiagnosisId})
      if (response.raw.status < 299) {
        return await response.value();
      } else {
        this.errorMessage = `Cannot retrieve list of waiting patients: ${response.raw.statusText}`
      }
    } catch (err: any) {
      this.errorMessage = `Cannot retrieve list of waiting patients: ${err.message || "unknown"}`
    }
    return [];
  }

  async componentWillLoad() {
    this.waitingPatients = await this.getWaitingPatientsAsync();
  }
  // TODO might change later

  render() {
    return (
      <Host>
        {this.errorMessage
          ? <div class="error">{this.errorMessage}</div>
          :
        <md-list>
          {this.waitingPatients.map(patient =>
            <md-list-item onClick={ () => this.entryClicked.emit(patient.id)}>
              <div slot="headline">{patient.name}</div>
              <div slot="supporting-text">{"Predpokladaný vstup: " + patient.estimatedStart?.toLocaleString()}</div>
                <md-icon slot="start">person</md-icon>
            </md-list-item>
          )}
        </md-list>
        }
      </Host>
    );
  }
}
