<template>
  <b-container fluid>
    <b-row style="justify-content: center;">
      <b-col lg="12">
        <iq-card class-name="iq-card-block iq-card-stretch iq-card-height todaysAssignments-body">
          <template v-slot:headerTitle>
            <div class="row justify-content-between pl-3 pr-3">
              <h4 class="card-title">Labels</h4>
              <div class="btn-add-patient  mt-0">
                <b-button variant="primary" @click="modalLabelsShow = true"><i
                    class="ri-add-line mr-2"></i>New Label
                </b-button>
              </div>
            </div>
          </template>
          <template v-slot:body>
            <b-row>
              <b-col md="12" class="table-responsive">
                <b-table
                    id="patients-table"
                    bordered
                    hover
                    @row-clicked="onLabelClick"
                    :busy="!isDataLoaded"
                    style="cursor: pointer;"
                    :items="labels"
                    :fields="columns"
                >
                  <template #table-busy>
                    <div class="text-center text-primary my-2">
                      <b-spinner class="align-middle"></b-spinner>
                      <strong class="loading">Loading...</strong>
                    </div>
                  </template>
                  <template v-slot:cell(color)="data">
                    <span v-if="data.item.color" class="d-flex">
                       <span
                           class="mr-2"
                           style="width: 50px; height: 20px; display:block;"
                           :style="{'background': data.item.color}"
                       ></span>
                       {{ data.item.color }}
                    </span>
                  </template>
                  <template v-slot:cell(action)="data">
                    <b-button variant=" iq-bg-danger mr-1 mb-1" size="sm" @click="deleteItem(data.item)"><i class="ri-close-circle-fill m-0"></i></b-button>
                  </template>
                </b-table>
              </b-col>
            </b-row>
          </template>
        </iq-card>
      </b-col>
    </b-row>
    <b-modal
        v-model="modalLabelsShow"
        :ok-disabled="isDisabled"
        no-close-on-backdrop
        size="md"
        :title="'New Label'"
        :ok-title="$t('assignments.addAssignmentsModal.save')"
        :cancel-title="$t('assignments.addAssignmentsModal.close')"
        @ok="addLabel"
        @close="cancelLabel"
        @cancel="cancelLabel"
    >
      <form>
        <div class="form-row">
          <div class="col-md-12 mb-3">
            <label for="title">Text </label>
            <b-form-input class="date" id="exampleInputdate" type="text" v-model="formData.text" ></b-form-input>
          </div>
          <div class="col-md-12 mb-3">
            <label for="title">Type </label>
            <b-form-input class="date" id="exampleInputdate" type="text" v-model="formData.type" ></b-form-input>
          </div>
          <div class="col-md-12 mb-3">
            <label for="title">Color </label>
            <chrome-picker v-model="formData.color"/>
          </div>
        </div>
      </form>
    </b-modal>
    </b-container>
</template>

<script>
import { xray } from '../../config/pluginInit'
import { createCalendarLabel, deleteCalendarLabel, getLabels, updateCalendarLabel } from '@/services/calendarService'
import { Chrome } from 'vue-color'

export default {
  components: {
    'chrome-picker': Chrome
  },
  name: 'Labels',
  mounted () {
    xray.index()
    this.getLabels(this.$i18n.locale)
  },
  data: function () {
    return {
      columns: [
        { label: 'Text', key: 'text', class: 'text-left' },
        { label: 'Type', key: 'type', class: 'text-left' },
        { label: 'Color', key: 'color', class: 'text-left' },
        { label: 'Action', key: 'action', class: 'text-center action-column' }
      ],
      labels: [],
      isDataLoaded: false,
      modalLabelsShow: false,
      formData: {
        id: null,
        text: '',
        type: '',
        color: ''
      }
    }
  },
  watch: {
    '$i18n.locale' () {
      this.getLabels(this.$i18n.locale)
    }
  },
  computed: {
    isDisabled () {
      return !this.formData.text || !this.formData.type || !this.formData.color
    }
  },
  methods: {
    getLabels (lang) {
      this.isDataLoaded = false
      getLabels(lang).then(data => {
        this.labels = data
        this.isDataLoaded = true
      })
    },
    deleteItem (item) {
      deleteCalendarLabel(item.id).then(data => {
        this.getLabels(this.$i18n.locale)
      })
    },
    onLabelClick (item) {
      this.formData = {
        id: item.id,
        type: item.type,
        text: item.text,
        color: item.color,
        lang: item.language
      }
      this.modalLabelsShow = true
    },
    addLabel () {
      this.formData.lang = this.$i18n.locale
      console.log(this.formData)
      if (!this.formData.id) {
        createCalendarLabel(this.formData).then(data => {
          this.getLabels(this.$i18n.locale)
          this.modalLabelsShow = false
          this.formData = this.defaultFormData()
        })
      } else {
        updateCalendarLabel(this.formData.id, this.formData).then(data => {
          this.getLabels(this.$i18n.locale)
          this.modalLabelsShow = false
          this.formData = this.defaultFormData()
        })
      }
    },
    cancelLabel () {
      this.formData = this.defaultFormData()
    },
    defaultFormData () {
      return {
        id: null,
        text: '',
        type: '',
        color: ''
      }
    }
  }
}
</script>
