<template>
  <div v-if="device === 'mobile'">

    <!-- Name, Date & Map settings -->
    <div :class="'app-container' + (mode === 'new' ? ' new' : ' edit')" v-if="activeView === 'edit-name'">

      <nav class="head">
        <h2>{{mode === 'edit' ? 'Note - Edit' : 'Note - Create'}}</h2>
        <span class="button-bar">
          <button class="icon" @click="activeView = 'edit-note'"><svg><use xlink:href="./dist/symbols.svg#arrow-forward">
            <title>Next</title>
          </use></svg></button>
          <button class="icon" @click="saveNote()"><svg><use xlink:href="./dist/symbols.svg#save">
            <title>Save</title>
          </use></svg></button>
        </span>
      </nav>

      <div class="content name-edit">

        <!-- CSS Grid requires 6 elements for layout (name, date, location, places, search, map) -->

        <div class="name">
          <label v-if="mode === 'edit'" for="noteName" style="font-size: smaller;">Name</label>
          <input type="text" id="noteName" v-model="note.name" maxlength="40" placeholder="Name for your note" tabindex="1">
          <span style="font-size: smaller;">
            Maximum 40 characters (<span :class="note.name.length < 30 ? 'char-count' : 'char-count-close'">{{40 - note.name.length}}</span> remaining)
          </span>
        </div>

        <div class="date">{{$moment(note.Created_date.toDate()).format('LLLL')}}</div>

        <div class="geocoords">
          <label for="geocords">Location:</label>
          <span v-if="hasGeocoords" id="geocords" class="link">{{geoLat + ', ' + geoLon}}</span>
          <span v-if="!hasGeocoords && locationDenied" class="location-denied">Location access has been denied</span>
          <span v-if="!hasGeocoords && !locationDenied" class="location-unknown">Your location can not be determined</span>
          <button class="icon small bg-lt action-icon" @click="updateCoordinates(true)">
            <svg class="icon-small"><use xlink:href="./dist/symbols.svg#my-location"></use></svg>
          </button>
        </div>

        <div class="place">
          <svg v-if="!hasPlace(note)" class="icon-small"><use xlink:href="./dist/symbols.svg#place"></use></svg>
          <img v-if="hasPlace(note)" :src="note.place.icon" class="icon-small" style="vertical-align:unset;" />
          <span :class="hasPlace(note) ? 'has-place' : 'no-place'" id="placeName">{{note.place && note.place._id ? note.place.name : 'Click the button to add a place'}}</span>
          <span style="float:right;">
            <button v-if="hasPlace(note)" @click="clearPlace()" style="margin-right: 10px;">Remove</button>
            <button v-if="hasPlace(note)" @click="findPlace()" tabindex="2">Change</button>
            <button v-if="!hasPlace(note)" @click="findPlace()" tabindex="2">Lookup Places</button>
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
          style="width:100%;  height:100%;"
        >
          <gmap-marker
            ref="myMarker"
            :draggable="true"
            @dragend="mapMarkerMoved"
            :position="{'lat':geoLat, 'lng':geoLon}"></gmap-marker>
        </gmap-map>

      </div>

      <div class="navigation">
        <a @click="closeNote()">Cancel</a>
        <a class="action-link" @click="activeView = 'edit-note'">Next</a>
      </div>

    </div>

    <!-- Note input -->
    <div :class="'app-container' + (mode === 'new' ? ' new' : ' edit')" v-if="activeView === 'edit-note'">

      <nav class="head">
        <h2>{{mode === 'edit' ? 'Note - Edit' : 'Note - Create'}}</h2>
        <span class="button-bar">
          <button class="icon" @click="activeView = 'edit-name'"><svg><use xlink:href="./dist/symbols.svg#arrow-back">
            <title>Back</title>
          </use></svg></button>
          <button class="icon" @click="saveNote()"><svg><use xlink:href="./dist/symbols.svg#save">
            <title>Save Note</title>
          </use></svg></button>
        </span>
      </nav>

      <div class="content note-edit">
        <textarea id="noteNote" v-model="note.note" placeholder="Your note"></textarea>
      </div>

      <div class="navigation">
        <a @click="closeNote()">Cancel</a>
        <a class="action-link" @click="saveNote()">Save</a>
        <a class="action-link" @click="activeView = 'edit-name'">Back</a>
      </div>
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
  /*
    I created this file as a way to test branching views based on mobile/desktop. Originally,
    I was just linking this file and NoteEdit.vue to the external script via the src attribute
    of the script tag. This didn't work and this view was overriding the NoteEdit component because
    it's module was being imported after NoteEdit. Got help showing me the right way to do this
    using the extends for composition. Would probably make more sense to just move the templating
    out of this file into NoteEdit and do my CSS branching in template of that file, but since it
    makes a nice example of using composition, I'm going to leave it for now.
  */
  import EditNoteImpl from './EditNoteImpl'

  export default {
    name: 'EditNoteMobile',
    extends: EditNoteImpl
  }
</script>

<style scoped>
  .app-container.edit .name-edit {
    display: grid;
    grid-template-rows: 120px 40px 50px 60px 40px auto;
  }
  .app-container.new .name-edit {
    display: grid;
    grid-template-rows: 90px 40px 50px 60px 40px auto;
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
  .content input {
    width: 100%;
  }
  .char-count {
    color: darkgreen;
  }
  .char-count-close {
    color: orangered;
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
  #noteNote {
    height: 100%;
    font-size: 1.8rem;
  }
  .content textarea {
    width: 100%;
    heigth: 100%;
    overflow: auto;
  }
  .content > *:last-child {
    margin-bottom: 0;
  }
</style>