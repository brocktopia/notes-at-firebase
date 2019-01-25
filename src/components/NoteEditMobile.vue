<template>
  <div :class="'app-container' + (mode === 'new' ? ' new' : ' edit')">

    <nav class="head">
      <h2>{{mode === 'edit' ? 'Note - Edit' : 'Note - Create'}}</h2>
      <span class="button-bar">
            <button class="icon" @click="$emit('next')"><svg><use xlink:href="dist/symbols.svg#arrow-forward">
              <title>Next</title>
            </use></svg></button>
            <button v-if="cansave" class="icon" @click="$emit('save')"><svg><use xlink:href="dist/symbols.svg#save">
              <title>Save</title>
            </use></svg></button>
          </span>
    </nav>

    <div v-if="note" class="content name-edit">

      <!-- CSS Grid requires 8 elements for layout (name, date, location, places, search, map, photo-upload, photo-viewer) -->

      <div class="name">
        <label v-if="mode === 'edit'" for="noteName" style="font-size: smaller;">Name</label>
        <input type="text" id="noteName" v-model="note.name" maxlength="40" placeholder="Name for your note" tabindex="1">
        <span style="font-size: smaller;">
              Maximum 40 characters (<span :class="note.name.length < 30 ? 'char-count' : 'char-count-close'">{{40 - note.name.length}}</span> remaining)
            </span>
      </div>

      <!--<div class="date">{{$moment(note.Created_date.toDate()).format('LLLL')}}</div>-->
      <div class="date">
        <datetime input-style="width: 100%" input-id="date" format="cccc, LLLL d, yyyy t" v-model="noteDate" type="datetime" />
      </div>

      <div class="geocoords">
        <label for="geocords">Location:</label>
        <span v-if="hasGeocoords" id="geocords" class="link">{{note.geocode.latitude + ', ' + note.geocode.longitude}}</span>
        <span v-if="!hasGeocoords && locationDenied" class="location-denied">Location access has been denied</span>
        <span v-if="!hasGeocoords && !locationDenied" class="location-unknown">Your location can not be determined</span>
        <button class="icon small bg-lt action-icon" @click="$emit('getgeo', true)">
          <svg class="icon-small"><use xlink:href="dist/symbols.svg#my-location"></use></svg>
        </button>
      </div>

      <div class="place">
        <svg v-if="!note.place || !note.place.icon" class="icon-small"><use xlink:href="dist/symbols.svg#place"></use></svg>
        <img v-if="!!note.place && !!note.place.icon" :src="note.place.icon" class="icon-small" style="vertical-align:unset;" />
        <span v-if="hasGeocoords" :class="!!note.place && !!note.place._id ? 'has-place' : 'no-place'" id="placeName">{{!!note.place && !!note.place._id ? note.place.name : 'Click the button to add a place'}}</span>
        <span style="float:right;">
          <button v-if="!!note.place && !!note.place._id " @click="$emit('clearplace')" style="margin-right: 10px;">Remove</button>
          <button v-if="!!note.place && !!note.place._id " @click="$emit('findplace')" tabindex="2">Change</button>
          <button v-if="!note.place || !note.place._id" @click="$emit('findplace')" tabindex="2">Lookup Places</button>
        </span>
      </div>

      <div class="search">
        <input
          type="text"
          v-model="mapSearchInput"
          class="map-search-input"
          placeholder="Search for location"
          @keyup.enter="$emit('search', mapSearchInput)"
        >
        <button class="icon small bg-lt" @click="$emit('search', mapSearchInput)"><svg><use xlink:href="dist/symbols.svg#search">
          <title>Search</title>
        </use></svg></button>
        <span class="map-info">Drag marker to move location.</span>
      </div>

      <gmap-map
        ref="NoteMap"
        :center="{'lat':note.geocode.latitude,'lng':note.geocode.longitude}"
        :zoom="15"
        style="width:100%;  height:100%;"
      >
        <gmap-marker
          ref="myMarker"
          :draggable="true"
          @dragend="$emit('mapmarker', arguments[0])"
          :position="{'lat':note.geocode.latitude, 'lng':note.geocode.longitude}"></gmap-marker>
      </gmap-map>

      <div class="photo-input">
        <input
          id="photo"
          name="photo"
          type="file"
          accept="image/*"
          @change="$emit('photoselect', $event)"
          ref="imageInput"
          multiple
        >
        <span class="button-bar" v-if="photoselected">
            <button class="small" @click="$emit('clearphotos')">Clear</button>
            <button v-if="mode !== 'new'" class="small" @click="$emit('uploadphotos')">Upload</button>
          </span>
      </div>

      <photo-scroller
        :photos="note.photos"
        :previews="previews"
        @select="$emit('photoclick', arguments[0])"
        @previewselect="$emit('previewclick', arguments[0])"
        @exif="$emit('onexif', arguments[0], arguments[1])"
        @missingphoto="$emit('missingphoto', arguments[0])"
      />

    </div>

    <div class="navigation">
      <a @click="$emit('close')">Cancel</a>
      <a class="action-link" @click="$emit('next')">Next</a>
      <a v-if="cansave" class="action-link" @click="$emit('save')">Save</a>
    </div>

  </div>
</template>

<script>
  import PhotoScroller from '@/components/PhotoScroller'

  export default {

    name: "NoteEditMobile",

    components: {
      PhotoScroller
    },

    props: {
      note: Object,
      mode: String,
      previews: Array,
      cansave: Boolean,
      photoselected: Boolean
    },

    data() {
      return {
        mapSearchInput: ''
      }
    },

    computed: {
      hasGeocoords() {
        return !!this.note && !!this.note.geocode;
      },
      noteDate: { // Firestore's Timestamp class requires transformation
        get() {
          return this.note.Created_date.toDate().toISOString();
        },
        set(date) {
          if (!date) return;
          date = new Date(date);
          this.note.Created_date = this.$firebase.firebase_.firestore.Timestamp.fromDate(date);
        }
      },
    },

    mounted() {
      //console.log(`NoteEditDesktop.mounted() mode ${this.mode} cansave ${this.cansave}`);
      // get map reference
      try {
        this.$refs.NoteMap.$mapPromise.then((map) => {
          this.$emit('mapload', map)
        });
      } catch (e) {
        console.warn('NoteEditDesktop.mounted() Failied to get Places Service!');
      }
    }

  }
</script>

<style lang="scss" scoped>

  .app-container.edit .name-edit {
    display: grid;
    grid-template-rows: 120px 50px 50px 60px 40px auto 45px 90px;
  }
  .app-container.new .name-edit {
    display: grid;
    grid-template-rows: 90px 50px 50px 60px 40px auto 45px 90px;
  }
  #noteName {
    font-size: 1.8rem;
  }
  .content {
    padding: 20px;
  }
  .content > * {
    margin-bottom: 10px;
  }
  .content input:not([type=file]) {
    width: 100%;
  }
  .char-count {
    color: darkgreen;
  }
  .char-count-close {
    color: orangered;
  }
  .date {
    width: 100%;
    height: 50px;
    padding-top: 5px;
  }
  .geocoords, .place {
    height: 50px;
    line-height: 50px;
    width: 100%;
  }
  span.no-place {
    font-size: smaller;
    color: #999999;
  }
  span.has-place {
    display: inline-block;
    max-width: 340px;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    vertical-align: text-bottom;
  }
  .place button {
    vertical-align: top;
  }
  .geocoords button {
    margin-top: 10px;
  }
  .place svg {
    fill: #ed453b;
  }
  .search {
    margin-bottom: 0;
  }
  .search input.map-search-input {
    display: inline-block;
    line-height: 1em;
    font-size: 1em;
    width: 250px;
    min-width: 250px;
  }
  .map-info {
    float: right;
    font-size: smaller;
    color: #888;
    margin-top: 8px;
  }
  input#photo {
    font-size: 1em;
    width: 380px !important;
  }
  .photo-input {
    .button-bar {
      float: right;
      button + button {
        margin-left: 5px;
      }
    }
  }
</style>
