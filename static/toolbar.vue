<!--
Copyright 2020 Google LLC

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

    https://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.
-->
<template>
  <b-navbar type='is-info' style="box-shadow: 0 3px 3px 0 lightgrey">
    <template slot="brand">
      <b-navbar-item style="font-size:24px" href="/">
        {{toolbarBrand}}
      </b-navbar-item>
    </template>
    <template slot="start">
      <b-tag type="is-warning" style="margin-top:1.2em" v-show="!online">
        {{ $t('toolbar.Offline mode') }}
      </b-tag>
    </template>
    <template slot="end">
      <b-navbar-item v-show="optionsButtonVisible" @click="$emit('open-customize-dialog')">
        <i class="fas fa-palette fa-fw"></i>&nbsp;{{ $t('common.Customize') }}
      </b-navbar-item>
      <b-navbar-item v-show="fullscreenButtonVisible" @click="enterFullScreen()">
        <i class="fa fa-expand fa-fw"></i>&nbsp;{{ $t('toolbar.Fullscreen') }}
      </b-navbar-item>
      <b-navbar-item v-show="exitFullscreenButtonVisible" @click="exitFullScreen()">
        <i class="fa fa-compress fa-fw"></i>&nbsp;{{ $t('toolbar.Exit fullscreen') }}
      </b-navbar-item>
      <b-navbar-item v-show="unlinkSheetButtonVisible" @click="$store.commit('unlinkSheet')">
        <i class="fa fa-unlink fa-fw"></i>&nbsp;{{ $t('toolbar.Unlink Google Spreadsheet') }}
      </b-navbar-item>
      <template>
        <b-navbar-item v-show="moreVisible" @click="toggleDarkMode()">
          <i class="fas fa-moon fa-fw"></i>&nbsp;{{ darkModeLabel }}
        </b-navbar-item>
        <b-navbar-dropdown v-if="$mq=='mobile'" :label="$t('toolbar.Language')">
          <b-navbar-item v-for="locale in locales" :key="locale.name"
            @click="$emit('set-locale', locale.name)">
              {{ locale.humanName }}
          </b-navbar-item>
        </b-navbar-dropdown>
        <b-navbar-item v-if="$mq!='mobile'" v-show="languageVisible" tag="div" href="#">
          <b-select v-model="locale">
            <option
              v-for="locale in locales"
              :value="locale.name"
              :key="locale.name">
              {{ locale.humanName }}
            </option>
            <option value='add-your-language'>
              {{ $t('toolbar.Add your language') }}
            </option>
          </b-select>
        </b-navbar-item>
      </template>
    </template>
  </b-navbar>
</template>

<script>
  import * as Util from './Util.js';
  import * as Locales from './Locales.js';
  import { mapGetters } from "vuex";

  export default {
    data() {
      return {
        toolbarBrand: window.location.host,
        locales: Locales.getNamesForAll(Util.platformSupportsFlags(navigator))
      };
    },
    computed: {
      locale: {
        get: function () {
          return this.$i18n.locale;
        },
        set: function(newValue) {
          if (newValue == 'add-your-language') {
            this.$router.push('/translate.html');
          }
          else {
            this.$emit('set-locale', newValue);
          }
        }
      },
      optionsButtonVisible: function() {
        return !this.fullScreen && !this.wheelIsBusy;
      },
      fullscreenButtonVisible: function() {
        return !this.fullScreen && !this.wheelIsBusy;
      },
      exitFullscreenButtonVisible: function() {
        return this.fullScreen;
      },
      moreVisible: function() {
        return this.online && !this.fullScreen && !this.wheelIsBusy;
      },
      unlinkSheetButtonVisible: function() {
        return this.sheetLinked && !this.fullScreen && !this.wheelIsBusy;
      },
      languageVisible: function() {
        return this.online && !this.fullScreen && !this.wheelIsBusy;
      },
      darkModeLabel() {
        return this.darkMode ? this.$t('toolbar.Light mode') : this.$t('toolbar.Dark mode');
      },
      ...mapGetters([
        'online', 'wheelIsBusy', 'fullScreen', 'sheetLinked', 'darkMode'
      ])
    },
    methods: {
      enterFullScreen() {
        Util.trackEvent('Wheel', 'EnterFullscreen', '');
        this.$store.commit('enterFullScreen');
      },
      exitFullScreen() {
        Util.trackEvent('Wheel', 'ExitFullscreen', '');
        this.$store.commit('exitFullScreen');
      },
      toggleDarkMode() {
        Util.trackEvent('Wheel', 'ToggleDarkMode', '');
        this.$store.commit('toggleDarkMode');
      }
    }
  }
</script>
