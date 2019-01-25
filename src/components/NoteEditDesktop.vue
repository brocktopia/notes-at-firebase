<template>
  <div class="app-container edit">

    <nav class="head">
      <h2>{{mode === 'edit' ? 'Note - Edit' : 'Note - Create'}}</h2>
      <span class="button-bar">
          <button class="icon action-icon" @click="$emit('close')"><svg><use xlink:href="dist/symbols.svg#close-note">
            <title>Cancel Edit</title>
          </use></svg></button>
          <button v-if="cansave" class="icon action-icon save-note" @click="$emit('save')"><svg><use xlink:href="dist/symbols.svg#save">
            <title>Save Note</title>
          </use></svg></button>
        </span>
    </nav>

    <div v-if="note" class="content note-edit">

      <!-- CSS Grid requires 9 elements for layout (name, date, location, places, search, map, note, photo-upload, photo-viewer) -->

      <div class="name">
        <label for="noteName">Name</label>
        <input type="text" id="noteName" v-model="note.name" maxlength="40" placeholder="Name for your note" tabindex="1">
        <span class="input-info"><span class="char-count">{{note.name.length}}</span> (40 character limit)</span>
      </div>

      <div class="date">
        <label for="date">Date</label>
        <datetime input-style="width: 360px;" input-id="date" format="cccc, LLLL d, yyyy t" v-model="noteDate" type="datetime" />
      </div>

      <div class="geocoords">
        <label for="geocords">Location:</label>
        <span v-if="hasGeocoords" id="geocords" class="link">{{note.geocode.latitude + ', ' + note.geocode.longitude}}</span>
        <span v-if="!hasGeocoords && locationDenied" class="location-denied">Location access has been denied</span>
        <span v-if="!hasGeocoords && !locationDenied" class="location-unknown">Your location can not be determined</span>
        <svg class="icon-small action-icon" @click="$emit('getgeo', true)"><use xlink:href="dist/symbols.svg#my-location"></use></svg>
      </div>

      <div class="place">
        <label v-if="!note.place || !note.place.icon" for="placeName">
          <svg class="icon-small"><use xlink:href="dist/symbols.svg#place"></use></svg>
        </label>
        <label v-if="!!note.place && !!note.place.icon" for="placeName">
          <img :src="note.place.icon" width="24" height="24" />
        </label>
        <span v-if="hasGeocoords" :class="note.place && note.place._id ? 'has-place' : 'no-place'" id="placeName">{{note.place && note.place._id ? note.place.name : 'Click the button to lookup a place'}}</span>
        <span style="float:right;">
            <button class="small" v-if="note.place && note.place._id" @click="$emit('clearplace')" style="margin-right: 10px;">Remove Place</button>
            <button class="small" @click="$emit('findplace')" tabindex="2">Lookup Places</button>
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
        v-if="hasGeocoords"
        ref="NoteMap"
        :center="{'lat':note.geocode.latitude,'lng':note.geocode.longitude}"
        :zoom="15"
        style="width:100%;  height: 150px;"
      >
        <gmap-marker
          ref="myMarker"
          :draggable="true"
          @dragend="$emit('mapmarker', arguments[0])"
          :position="{'lat':note.geocode.latitude, 'lng':note.geocode.longitude}"></gmap-marker>
      </gmap-map>

      <div class="note-input">
        <textarea id="noteNote" v-model="note.note" placeholder="Your note" tabindex="3"></textarea>
      </div>

      <div class="photo-input">
        <label for="photo">Add Photo</label>
        <input
          id="photo"
          name="photo"
          type="file"
          accept="image/*"
          @change="$emit('photoselect', $event)"
          ref="imageInput"
          width="350"
          multiple
        >
        <span class="button-bar" v-if="photoselected">
            <button class="small" @click="$emit('clearphotos')">Clear</button>
            <button v-if="cansave" class="small" @click="$emit('uploadphotos')">Upload</button>
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
      <a v-if="cansave" class="action-link" @click="$emit('save')">Save</a>
    </div>

  </div>
</template>

<script>
  import PhotoScroller from '@/components/PhotoScroller'

  export default {

    name: "NoteEditDesktop",

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
      console.log(`NoteEditDesktop.mounted()`);
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
  .content {
    padding: 8px 20px;
    display: grid;
    grid-template-rows: 45px 30px 35px 35px 30px 155px auto 35px 90px;
  }
  .content > * {
    margin-bottom: 10px;
  }
  .content input {
    width: 60%;
  }
  .input-info {
    font-size: smaller;
  }
  .char-count {
    color: orangered;
  }
  .name, .date {
    label {
      display: inline-block;
      min-width: 50px;
    }
  }
  .date * {
    display: inline-block;
  }
  .geocoords, .place {
    height: 30px;
    line-height: 30px;
    width: 100%;
  }
  .place button {
    vertical-align: top;
  }
  .place svg {
    fill: #ed453b;
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
  .search {
    margin-bottom: 0;
  }
  .search input {
    display: inline-block;
    width: 250px;
  }
  .map-info {
    float: right;
    font-size: smaller;
    color: #888;
    margin-top: 8px;
  }
  .content textarea {
    width: 100%;
    heigth: 100%;
    overflow: auto;
  }
  #noteNote {
    height: 100%;
  }
  .content > *:last-child {
    margin-bottom: 0;
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
