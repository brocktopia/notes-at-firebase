<template>
  <div class="app-container edit">

    <nav class="head">
      <h2>{{mode === 'edit' ? 'Note - Edit' : 'Note - Create'}}</h2>
      <span class="button-bar">
        <button class="icon action-icon" @click="closeNote()"><svg><use xlink:href="./dist/symbols.svg#close-note">
          <title>Cancel Edit</title>
        </use></svg></button>
        <button class="icon action-icon" @click="saveNote()"><svg><use xlink:href="./dist/symbols.svg#save">
          <title>Save Note</title>
        </use></svg></button>
      </span>
    </nav>

    <div class="content note-edit">

      <!-- CSS Grid requires 7 elements for layout (name, date, location, places, search, map & note) -->

      <div class="name">
        <label for="noteName">Name</label>
        <input type="text" id="noteName" v-model="note.name" maxlength="40" placeholder="Name for your note" tabindex="1">
        <span class="input-info"><span class="char-count">{{note.name.length}}</span> (40 character limit)</span>
      </div>

      <div class="date">{{$moment(note.Created_date.toDate()).format('LLLL')}}</div>

      <div class="geocoords">
        <label for="geocords">Location:</label>
        <span v-if="hasGeocoords" id="geocords" class="link">{{geoLat + ', ' + geoLon}}</span>
        <span v-if="!hasGeocoords && locationDenied" class="location-denied">Location access has been denied</span>
        <span v-if="!hasGeocoords && !locationDenied" class="location-unknown">Your location can not be determined</span>
        <svg class="icon-small action-icon" @click="updateCoordinates(true)"><use xlink:href="./dist/symbols.svg#my-location"></use></svg>
      </div>

      <div class="place">
        <label v-if="!hasPlace(note)" for="placeName">
          <svg class="icon-small"><use xlink:href="./dist/symbols.svg#place"></use></svg>
        </label>
        <label v-if="hasPlace(note)" for="placeName">
          <img :src="note.place.icon" width="24" height="24" />
        </label>
        <span v-if="hasGeocoords" :class="note.place && note.place._id ? 'has-place' : 'no-place'" id="placeName">{{note.place && note.place._id ? note.place.name : 'Click the button to lookup a place'}}</span>
        <span style="float:right;">
          <button class="small" v-if="note.place && note.place._id" @click="clearPlace()" style="margin-right: 10px;">Remove Place</button>
          <button class="small" @click="findPlace()" tabindex="2">Lookup Places</button>
        </span>
      </div>

      <div class="search">
        <input
          type="text"
          v-model="mapSearchInput"
          class="map-search-input"
          placeholder="Search for location"
          @keyup.enter="searchForLocation(mapSearchInput)"
        >
        <button class="icon small bg-lt" @click="searchForLocation(mapSearchInput)"><svg><use xlink:href="./dist/symbols.svg#search">
          <title>Search</title>
        </use></svg></button>
        <span class="map-info">Drag marker to move location.</span>
      </div>

      <gmap-map
        ref="NoteMap"
        :center="{'lat':geoLat,'lng':geoLon}"
        :zoom="15"
        style="width:100%;  height: 150px;"
      >
        <gmap-marker
          ref="myMarker"
          :draggable="true"
          @dragend="mapMarkerMoved"
          :position="{'lat':note.geocode.latitude, 'lng':note.geocode.longitude}"></gmap-marker>
      </gmap-map>

      <div class="note-input">
        <textarea id="noteNote" v-model="note.note" placeholder="Your note" tabindex="3"></textarea>
      </div>

    </div>

    <div class="navigation">
      <a @click="closeNote()">Cancel</a>
      <a class="action-link" @click="saveNote()">Save</a>
    </div>

    <places-dialog
      v-if="showPlacesDialog"
      :places="places"
      :placeName="placeName"
      :showMore="showMoreButton"
      v-on:select="placeSelected"
      v-on:close="placesClose"
      v-on:place="placeInputUpdated"
      v-on:more="moreSelected"
    ></places-dialog>

    <modal-dialog
      v-if="showMessage"
      @close="showMessage = false"
    >
      <h3 :class="messageClass" slot="header">{{messageTitle}}</h3>
      <div slot="body" v-html="messageBody"></div>
    </modal-dialog>

    <modal-dialog
      v-if="showConfirm"
      :modalType="'yesno'"
      @close="showConfirm = false"
      @confirm="confirmMethod()"
    >
      <h3 :class="'notify'" slot="header">{{confirmTitle}}</h3>
      <div slot="body" v-html="confirmBody"></div>
    </modal-dialog>

    <div class="loading-mask" v-if="isLoading"><span>{{loadingMessage}}</span></div>

  </div>
</template>

<script>
  // Shared codebase with NoteEditMobile so externalized that code
  import EditNoteImpl from './EditNoteImpl'

  export default {
    name: 'EditNote',
    extends: EditNoteImpl
  }
</script>

<style scoped>
  .content {
    padding: 8px 20px;
    display: grid;
    grid-template-rows: 45px 30px 35px 35px 30px 155px auto;
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
</style>