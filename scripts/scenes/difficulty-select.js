define(["osu", "skin", "scenes/playback", "hash", "underscore"], function(Osu, Skin, Playback, Hash, _) {
    function DifficultySelect(game, osu) {
        var self = this;
        self.osu = osu;
        self.game = game;
        self.background = null;
        self.tracks = _.sortBy(osu.tracks, function(t) { return t.difficulty.OverallDifficulty; });
        self.tracks = _.filter(self.tracks, function(t) { return t.general.Mode === 0; });

        // Load background if possible
        if (self.osu.tracks[0].events.length != 0) {
            self.ready = false;
            var file = self.osu.tracks[0].events[0][2];
            if (self.osu.tracks[0].events[0][0] === "Video") {
                file = self.osu.tracks[0].events[1][2];
            }
            file = file.substr(1, file.length - 2);
            entry = osu.zip.getChildByName(file);
            if (entry) {
                entry.getBlob("image/jpeg", function (blob) {
                    if (disposed) {
                        return;
                    }
                    var uri = URL.createObjectURL(blob);
                    var texture = PIXI.Texture.fromImage(uri);
                    self.background = new PIXI.Sprite(texture);
                    self.background.x = self.background.y = 0;
                    self.background.width = self.game.window.innerWidth;
                    self.background.height = self.game.window.innerHeight;
                    self.game.stage.addChild(self.background);
                    self.game.stage.setChildIndex(self.background, 0);
                });
            }
        }
        
        var disposed = false;
        this.click = function(e) {
            if (disposed) return;
            for (var i = 0; i < self.tracks.length; i++) {
                var menu = Skin["menu-button-background.png"];
                var x = game.window.innerWidth / 2 - menu.width / 2;
                var y = (i * (menu.height + 10)) + 10 + 30 + 20;
                if (e.clientX > x && e.clientX < x + menu.width &&
                        e.clientY > y && e.clientY < y + menu.height) {
                    // this difficulty is clicked on
                    self.teardown();
                    disposed = true;
                    Hash.beatmap(self.tracks[i].metadata.BeatmapID);

                    // load hitsound set
                    // TODO: add loading hint
                    if (self.tracks[0].general.SampleSet == "Normal")
                        self.game.sampleSet = 1;
                    if (self.tracks[0].general.SampleSet == "Soft")
                        self.game.sampleSet = 2;
                    if (self.tracks[0].general.SampleSet == "Drum")
                        self.game.sampleSet = 3;
                    var sample = [
                        'hitsounds/normal-hitnormal.mp3',
                        'hitsounds/normal-hitwhistle.mp3',
                        'hitsounds/normal-hitfinish.mp3',
                        'hitsounds/normal-hitclap.mp3',
                        'hitsounds/soft-hitnormal.mp3',
                        'hitsounds/soft-hitwhistle.mp3',
                        'hitsounds/soft-hitfinish.mp3',
                        'hitsounds/soft-hitclap.mp3',
                        'hitsounds/drum-hitnormal.mp3',
                        'hitsounds/drum-hitwhistle.mp3',
                        'hitsounds/drum-hitfinish.mp3',
                        'hitsounds/drum-hitclap.mp3'
                    ];
                    console.log("Loading hit sounds:");
                    console.log(sample);
                    sounds.load(sample);
                    sounds.whenLoaded = function(){
                        game.sample[1].hitnormal = sounds['hitsounds/normal-hitnormal.mp3'];
                        game.sample[1].hitwhistle = sounds['hitsounds/normal-hitwhistle.mp3'];
                        game.sample[1].hitfinish = sounds['hitsounds/normal-hitfinish.mp3'];
                        game.sample[1].hitclap = sounds['hitsounds/normal-hitclap.mp3'];
                        game.sample[2].hitnormal = sounds['hitsounds/soft-hitnormal.mp3'];
                        game.sample[2].hitwhistle = sounds['hitsounds/soft-hitwhistle.mp3'];
                        game.sample[2].hitfinish = sounds['hitsounds/soft-hitfinish.mp3'];
                        game.sample[2].hitclap = sounds['hitsounds/soft-hitclap.mp3'];
                        game.sample[3].hitnormal = sounds['hitsounds/drum-hitnormal.mp3'];
                        game.sample[3].hitwhistle = sounds['hitsounds/drum-hitwhistle.mp3'];
                        game.sample[3].hitfinish = sounds['hitsounds/drum-hitfinish.mp3'];
                        game.sample[3].hitclap = sounds['hitsounds/drum-hitclap.mp3'];
                        
                        // start playback
                        var playback = new Playback(self.game, self.osu, self.tracks[i]);
                        game.scene = playback;
                        playback.start();
                    };
                    return;
                }
            }
        }

        game.window.addEventListener('click', self.click);

        var tracks = [];
        for (var i = 0; i < self.tracks.length; i++) {
            var track = self.tracks[i];
            var sprite = new PIXI.Sprite(Skin["menu-button-background.png"]);
            var leftEdge = game.window.innerWidth / 2 - sprite.width / 2;
            var titletext = track.metadata.Artist + " - " + track.metadata.Title + " / " + track.metadata.Version;
            var text = new PIXI.Text(titletext, { font: "20px sans-serif" });
            sprite.x = leftEdge;
            sprite.y = i * (sprite.height + 10) + 10 + 30 + 20;
            text.x = leftEdge + 20;
            text.y = i * (sprite.height + 10) + 30 + 20 + (sprite.height / 2);
            tracks.push({ sprite: sprite, text: text });
            game.stage.addChild(sprite);
            game.stage.addChild(text);
        }

        this.render = function(time) {
            if (!disposed && Hash.beatmap()) {
                disposed = true;
                self.teardown();
                var playback = new Playback(self.game, self.osu, _.find(self.tracks, function(t) {
                    return t.metadata.BeatmapID === +Hash.beatmap();
                }));
                self.game.scene = playback;
                playback.start();
            }
        }
        
        this.teardown = function() {
            if (self.background) {
                self.game.stage.removeChild(self.background);
                self.background.destroy();
            }
            for (var i = 0; i < tracks.length; i++) {
                self.game.stage.removeChild(tracks[i].sprite);
                self.game.stage.removeChild(tracks[i].text);
                tracks[i].sprite.destroy();
                tracks[i].text.destroy();
            }
        };
    }

    return DifficultySelect;
});
