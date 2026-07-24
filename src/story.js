/**
 * Steamed Hams story — sketch beats:
 * arrival → smoking oven → ruined roast → window escape (calves / steamed clams)
 * → burger run → serve hams → Albany/Utica → excuse me / check kitchen
 * → "I'm pooped" / GOOD LORD / aurora → see Chalmers out
 */

import * as THREE from "three";
import { playDoorSwing } from "./audio.js";

export function createStory(refs, lights, ui, player) {
  const _look = new THREE.Vector3();
  const state = {
    stage: "await_doorbell",
    fireSeen: false,
    windowAttempted: false,
    hasHams: false,
    served: false,
    kitchenChecked: false,
    suspicion: 0,
  };

  const objectives = {
    await_doorbell: ["Objective", "Answer the door — Superintendent Chalmers has arrived."],
    discover_fire: ["Objective", "Something smells terrible. Check the oven in the kitchen."],
    escape_window: [
      "Devilish plan",
      "Slip out the kitchen window for fast food — before Chalmers catches you.",
    ],
    get_hams: ["Objective", "Deliver the steamed hams — pick them up from the sideboard."],
    serve: ["Objective", "Serve the steamed hams at the dining table."],
    talk: ["Objective", "Survive Chalmers' questioning."],
    check_kitchen: ["Objective", "Excuse yourself — check the kitchen, then wrap this up."],
    see_out: ["Objective", "See Superintendent Chalmers out."],
    done: ["Complete", "An unforgettable luncheon."],
  };

  function setObjective(stage) {
    const o = objectives[stage] || objectives.done;
    ui.setObjective(o[0], o[1]);
  }

  function setStage(stage) {
    state.stage = stage;
    setObjective(stage);
  }

  /** Smoke only — oven closed, no visible flames yet. */
  function startOvenSmoking() {
    refs.fire.visible = false;
    refs.roast.visible = false;
    refs.kitchenSmoke.visible = true;
    refs.chimneySmoke.visible = true;
    lights.fire.intensity = 0.2;
    if (lights.kitchen) lights.kitchen.intensity = 0.55;
    if (refs.ovenDoor) {
      refs.ovenDoor.rotation.x = refs.ovenDoor.userData.closedRotX ?? 0;
    }
  }

  function openOven() {
    if (refs.ovenDoor) {
      refs.ovenDoor.rotation.x = refs.ovenDoor.userData.openRotX ?? Math.PI / 2.15;
    }
    refs.fire.visible = true;
    refs.roast.visible = true;
    // Flames take over — hold the smoke while looking inside
    refs.kitchenSmoke.visible = false;
    lights.fire.intensity = 3.2;
  }

  function closeOven() {
    if (refs.ovenDoor) {
      refs.ovenDoor.rotation.x = refs.ovenDoor.userData.closedRotX ?? 0;
    }
    refs.fire.visible = false;
    refs.roast.visible = false;
    refs.kitchenSmoke.visible = true;
    refs.chimneySmoke.visible = true;
    lights.fire.intensity = 0.25;
  }

  function hideKitchenDoor() {
    refs.kitchenDoor.visible = false;
  }

  function shutKitchenDoor() {
    refs.kitchenDoor.visible = true;
    refs.kitchenDoor.position.copy(refs.kitchenDoor.userData.origin);
    refs.kitchenDoor.rotation.y = refs.kitchenDoor.userData.closedRotY ?? 0;
    refs.kitchenDoor.userData.label = "Check the kitchen";
    lights.fire.intensity = 1.4;
    playDoorSwing({ volume: 0.55, rate: 1.15 });
  }

  function openKitchenDoorWide() {
    playDoorSwing({ volume: 0.9 });
    refs.kitchenDoor.position.copy(refs.kitchenDoor.userData.origin);
    refs.kitchenDoor.rotation.y = refs.kitchenDoor.userData.openWideRotY ?? -Math.PI / 2;
    refs.fire.visible = true;
    refs.kitchenInferno.visible = true;
    refs.kitchenSmoke.visible = true;
    refs.chimneySmoke.visible = true;
    lights.fire.intensity = 3.5;
    if (lights.inferno) lights.inferno.intensity = 4.5;
    if (lights.kitchen) lights.kitchen.intensity = 0.15;
  }

  function revealHouseFire() {
    refs.kitchenDoor.visible = false;
    refs.fire.visible = true;
    refs.kitchenInferno.visible = true;
    refs.kitchenSmoke.visible = true;
    refs.chimneySmoke.visible = true;
    refs.houseFire.visible = true;
    lights.fire.intensity = 3.5;
    if (lights.inferno) lights.inferno.intensity = 4;
    lights.houseFire.intensity = 4.5;
    if (lights.porch) lights.porch.intensity = 0.4;
  }

  function seatChalmers() {
    refs.chalmers.position.set(2.8, 0, -1.15);
    refs.chalmers.rotation.y = Math.PI;
    if (refs.wineService) refs.wineService.visible = true;
  }

  function chalmersAtKitchen() {
    if (refs.kitchenDoor) {
      refs.kitchenDoor.position.copy(refs.kitchenDoor.userData.origin);
      refs.kitchenDoor.rotation.y = refs.kitchenDoor.userData.openWideRotY ?? -Math.PI / 2;
    }
    refs.chalmers.position.set(-3.4, 0, -2.8);
    faceChalmersToward(-3.8, -5.0);
  }

  /** Character forward is local -Z. */
  function faceChalmersToward(x, z) {
    const dx = x - refs.chalmers.position.x;
    const dz = z - refs.chalmers.position.z;
    refs.chalmers.rotation.y = Math.atan2(-dx, -dz);
    refs.chalmers.updateMatrixWorld?.(true);
  }

  function chalmersSeesKitchen() {
    refs.chalmers.position.set(2.2, 0, -0.2);
    faceChalmersToward(-4.0, -6.0);
  }

  function chalmersOutside() {
    refs.chalmers.position.set(1.6, 0, 10.2);
    // Face Skinner on the lawn
    faceChalmersToward(-0.35, 8.4);
  }

  function skinnerOutside() {
    if (!refs.skinner) return;
    refs.skinner.visible = true;
    refs.skinner.position.set(-0.35, 0, 8.4);
    // Character forward is local -Z — face Chalmers
    const dx = refs.chalmers.position.x - refs.skinner.position.x;
    const dz = refs.chalmers.position.z - refs.skinner.position.z;
    refs.skinner.rotation.y = Math.atan2(-dx, -dz);
  }

  function beginEscort() {
    // Lead Chalmers to the porch as you see him out
    refs.chalmers.position.set(0.6, 0, 6.2);
    refs.chalmers.rotation.y = 0;
    if (refs.door) refs.door.visible = false;
    if (refs.yardExit) {
      refs.yardExit.visible = true;
      refs.yardExit.userData.label = "See Chalmers out";
    }
    setStage("see_out");
  }

  function unlockHams() {
    refs.hamReady.visible = true;
    refs.hamReady2.visible = true;
    refs.hamProxy.visible = true;
  }

  function lookAtFire() {
    if (!player) return;
    if (refs.kitchenInferno?.visible) {
      _look.set(-4.0, 2.0, -5.0);
      player.faceToward(_look, { headY: 2.0, duration: 0.45 });
      return;
    }
    if (!refs.fire) return;
    refs.fire.getWorldPosition(_look);
    _look.y += 0.5;
    player.faceToward(_look, { headY: _look.y, duration: 0.45 });
  }

  function lookAtOven() {
    if (!player) return;
    _look.set(-4.15, 1.0, -6.4);
    player.faceToward(_look, { headY: 1.0, duration: 0.4 });
  }

  function lookAtChalmers() {
    if (!player) return;
    player.faceToward(refs.chalmers.position, { headY: 1.75, duration: 0.45 });
  }

  function lookAtKrusty() {
    if (!player) return;
    // Far enough back that the window proxy is in front of the camera
    // (not around/inside it), so the E prompt can register.
    player.state.pos.set(-2.95, 1.7, -5.2);
    if (refs.krusty) {
      refs.krusty.getWorldPosition(_look);
      _look.y = 2.8;
    } else {
      _look.set(-40, 2.8, -6);
    }
    player.faceToward(_look, { headY: 1.85, duration: 0.75 });
  }

  function lookAtBurgers() {
    if (!player) return;
    if (refs.hamReady?.visible) {
      refs.hamReady.getWorldPosition(_look);
      _look.y += 0.2;
    } else if (refs.hamProxy) {
      refs.hamProxy.getWorldPosition(_look);
    } else {
      _look.set(-4.55, 1.25, -3.3);
    }
    player.faceToward(_look, { headY: _look.y, duration: 0.55 });
  }

  function canInteract(id) {
    switch (id) {
      case "frontDoor":
      case "chalmers":
        return state.stage === "await_doorbell";
      case "stove":
        return (
          (state.stage === "discover_fire" || state.stage === "escape_window") && !state.fireSeen
        );
      case "kitchenWindow":
        return state.stage === "escape_window" && state.fireSeen && !state.windowAttempted;
      case "steamedHams":
        return state.stage === "get_hams" && !state.hasHams;
      case "serveSpot":
        return state.stage === "serve" && state.hasHams && !state.served;
      case "kitchenDoor":
        return state.stage === "check_kitchen" && !state.kitchenChecked;
      case "yardExit":
        return state.stage === "see_out";
      default:
        return false;
    }
  }

  function labelFor(id, fallback) {
    if (!canInteract(id)) return null;
    if (id === "stove" && !state.fireSeen) return "Open the oven";
    if (id === "kitchenWindow") return "Climb out the kitchen window";
    if (id === "kitchenDoor") return "Open the kitchen door";
    if (id === "yardExit") return "See Chalmers out";
    return fallback;
  }

  function interact(id) {
    if (!canInteract(id)) return;

    switch (id) {
      case "frontDoor":
      case "chalmers":
        beginArrival();
        break;

      case "stove":
        if (!state.fireSeen) discoverFire();
        break;

      case "kitchenWindow":
        attemptWindowEscape();
        break;

      case "steamedHams":
        state.hasHams = true;
        refs.hamReady.visible = false;
        refs.hamReady2.visible = false;
        refs.hamProxy.visible = false;
        refs.plateSpot.visible = true;
        setStage("serve");
        ui.openDialogue({
          speaker: "Skinner",
          line: "Superintendent, I hope you're ready for mouth-watering hamburgers.",
          continue: () => {
            ui.closeDialogue();
            ui.toast("Serve them at the dining table.");
          },
        });
        break;

      case "serveSpot":
        state.served = true;
        state.hasHams = false;
        refs.hamOnTable.visible = true;
        refs.hamOnTable2.visible = true;
        refs.plateSpot.visible = false;
        setStage("talk");
        beginInterrogation();
        break;

      case "kitchenDoor":
        kitchenReveal();
        break;

      case "yardExit":
        lawnEnding();
        break;
    }
  }

  function beginArrival() {
    ui.openDialogue({
      speaker: "Chalmers",
      line: "Well, Seymour, I made it... Despite your directions.",
      continue: () => {
        ui.openDialogue({
          speaker: "Skinner",
          line: "Ahhh, Superintendent Chalmers! Welcome! I hope you're prepared for an unforgettable luncheon.",
          continue: () => {
            ui.openDialogue({
              speaker: "Chalmers",
              line: "Nyeh...",
              continue: () => {
                playDoorSwing({ volume: 0.85 });
                refs.door.visible = false;
                seatChalmers();
                startOvenSmoking();
                hideKitchenDoor();
                setStage("discover_fire");
                ui.closeDialogue();
                ui.toast("He's seated. Something is smoking in the kitchen...");
              },
            });
          },
        });
      },
    });
  }

  function discoverFire() {
    state.fireSeen = true;
    openOven();
    lookAtOven();

    ui.openDialogue({
      speaker: "Skinner",
      line: "GASP! Oh egads! My roast is ruined!",
      continue: () => {
        closeOven();
        lookAtKrusty();
        ui.openDialogue({
          speaker: "Skinner",
          line: "But what if... I were to purchase fast food and disguise it as my own cooking?",
          continue: () => {
            ui.openDialogue({
              speaker: "Skinner",
              line: "Oh ho ho ho ho ho! Delightfully devilish, Seymour.",
              continue: () => {
                setStage("escape_window");
                ui.closeDialogue();
              },
            });
          },
        });
      },
    });
  }

  function attemptWindowEscape() {
    state.windowAttempted = true;
    chalmersAtKitchen();
    if (player) {
      player.state.pos.set(-3.8, 1.7, -5.0);
      faceChalmersToward(player.state.pos.x, player.state.pos.z);
      lookAtChalmers();
    }

    ui.openDialogue({
      speaker: "Chalmers",
      line: "SEYMOUR!!!!!!!",
      continue: () => {
        ui.openDialogue({
          speaker: "Skinner",
          line: "Superintendent, I was just— uh, just stretching my calves on the windowsill. Isometric exercise! Care to join me?",
          continue: () => {
            lookAtOven();
            ui.openDialogue({
              speaker: "Chalmers",
              line: "Why is there smoke coming out of your oven, Seymour?",
              continue: () => {
                ui.openDialogue({
                  speaker: "Skinner",
                  line: "Uh... Ooh! That isn't smoke. It's steam. Steam from the steamed clams we're having. Mmmm. Steamed Clams!",
                  continue: () => {
                    lookAtChalmers();
                    ui.openDialogue({
                      speaker: "Chalmers",
                      line: "Uh-huh.",
                      continue: () => {
                        seatChalmers();
                        hideKitchenDoor();
                        ui.openDialogue({
                          speaker: "Skinner",
                          line: "Whew...",
                          continue: () => finishWindowEscape(),
                        });
                      },
                    });
                  },
                });
              },
            });
          },
        });
      },
    });
  }

  function finishWindowEscape() {
    if (refs.kitchenSash) {
      refs.kitchenSash.rotation.y =
        refs.kitchenSash.userData.openRotY ?? -1.35;
    }
    hideKitchenDoor();

    ui.openDialogue({
      speaker: "Narrator",
      line: "You drop from the sill, sprint to Krusty Burger in the distance, and return with a platter of hamburgers...",
      continue: () => {
        unlockHams();
        setStage("get_hams");
        lookAtBurgers();
        ui.closeDialogue();
        ui.toast("Steamed hams acquired. Deliver them to the table!");
      },
    });
  }

  function beginInterrogation() {
    lookAtChalmers();
    ui.openDialogue({
      speaker: "Chalmers",
      line: "I thought we were having steamed clams.",
      continue: () => {
        ui.openDialogue({
          speaker: "Skinner",
          line: "D'oh no, I said Steamed Hams! That's what I call hamburgers.",
          continue: () => {
            ui.openDialogue({
              speaker: "Chalmers",
              line: "You call hamburgers 'steamed hams'?",
              continue: () => regionBit(),
            });
          },
        });
      },
    });
  }

  function regionBit() {
    ui.openDialogue({
      speaker: "Skinner",
      line: "Yes! It's a regional dialect.",
      continue: () => {
        ui.openDialogue({
          speaker: "Chalmers",
          line: "Uh-huh. What region?",
          choices: [
            {
              text: "Uhhh— upstate New York?",
              next: () => albanyBit(),
            },
            {
              text: "The steamed-ham region of... Canada?",
              next: () => {
                state.suspicion += 2;
                ui.openDialogue({
                  speaker: "Chalmers",
                  line: "Really. I find that difficult to believe.",
                  continue: () => albanyBit(),
                });
              },
            },
          ],
        });
      },
    });
  }

  function albanyBit() {
    ui.openDialogue({
      speaker: "Chalmers",
      line: "Really. Well, I'm from Utica and I've never heard anyone use the phrase 'steamed hams'.",
      choices: [
        {
          text: "Oh, not in Utica, no. It's an Albany expression.",
          next: () => krustyBit(),
        },
        {
          text: "Perhaps Utica is behind the times, sir.",
          next: () => {
            state.suspicion += 2;
            fail("Never insult a man's hometown over steamed hams.");
          },
        },
      ],
    });
  }

  function krustyBit() {
    ui.openDialogue({
      speaker: "Chalmers",
      line: "I see.",
      continue: () => {
        ui.openDialogue({
          speaker: "Chalmers",
          line: "You know, these hamburgers are quite similar to the ones they have at Krusty Burger.",
          continue: () => {
            ui.openDialogue({
              speaker: "Skinner",
              line: "Oh ho ho ho no! Patented Skinner Burgers; Old family recipe!",
              continue: () => {
                ui.openDialogue({
                  speaker: "Chalmers",
                  line: "For steamed hams?",
                  continue: () => {
                    ui.openDialogue({
                      speaker: "Skinner",
                      line: "Yes.",
                      continue: () => grilledBit(),
                    });
                  },
                });
              },
            });
          },
        });
      },
    });
  }

  function grilledBit() {
    ui.openDialogue({
      speaker: "Chalmers",
      line: "Yes, and you call them steamed hams, despite the fact that they are obviously grilled.",
      continue: () => {
        ui.openDialogue({
          speaker: "Skinner",
          line: "Y— You know th— One thing I sh— 'Scuse me for one second...",
          continue: () => {
            ui.openDialogue({
              speaker: "Chalmers",
              line: "Of course.",
              continue: () => {
                shutKitchenDoor();
                setStage("check_kitchen");
                ui.closeDialogue();
                ui.toast("Excuse yourself — check the kitchen.");
              },
            });
          },
        });
      },
    });
  }

  function kitchenReveal() {
    state.kitchenChecked = true;
    openKitchenDoorWide();
    lookAtFire();

    ui.openDialogue({
      speaker: "Skinner",
      line: "Well, that was wonderful. A good time was had by all. I'm pooped.",
      continue: () => {
        chalmersSeesKitchen();
        lookAtChalmers();
        ui.openDialogue({
          speaker: "Chalmers",
          line: "Yes, I should be—",
          continue: () => {
            lookAtFire();
            ui.openDialogue({
              speaker: "Chalmers",
              line: "GOOD LORD! What is happening in there?",
              continue: () => {
                lookAtChalmers();
                ui.openDialogue({
                  speaker: "Skinner",
                  line: "Aurora Borealis.",
                  continue: () => auroraExchange(),
                });
              },
            });
          },
        });
      },
    });
  }

  function auroraExchange() {
    ui.openDialogue({
      speaker: "Chalmers",
      line: "A—Aurora Borealis? At this time of year! At this time of day! In this part of the country! Localized entirely within your kitchen?!?",
      continue: () => {
        ui.openDialogue({
          speaker: "Skinner",
          line: "Yes.",
          continue: () => {
            ui.openDialogue({
              speaker: "Chalmers",
              line: "May I see it?",
              choices: [
                {
                  text: "No.",
                  next: () => {
                    ui.openDialogue({
                      speaker: "Skinner",
                      line: "No.",
                      continue: () => {
                        beginEscort();
                        ui.closeDialogue();
                        ui.toast("See the Superintendent out.");
                      },
                    });
                  },
                },
                {
                  text: "Of course! Right this way!",
                  next: () => {
                    state.suspicion += 3;
                    fail("You invited him into the inferno. The facade is ash.");
                  },
                },
              ],
            });
          },
        });
      },
    });
  }

  function lawnEnding() {
    chalmersOutside();
    skinnerOutside();
    refs.yardExit.visible = false;
    if (refs.door) refs.door.visible = false;

    // Spectator angle: both characters on the lawn, house behind them
    if (player) {
      player.state.pos.set(-3.2, 1.75, 13.2);
      player.state.yaw = -0.55;
      player.state.pitch = -0.08;
      player.state.lookAnim = null;
      _look.set(0.6, 1.4, 9.2);
      player.faceToward(_look, { headY: 1.45, duration: 0.35 });
    }

    const oddFellow =
      state.suspicion <= 2
        ? "Well, Seymour, you are an odd fellow, but I must say — you steam a good ham."
        : "Well, Seymour, you are an odd fellow — and somehow, against all odds, you steam a good ham.";

    ui.openDialogue({
      speaker: "Mother",
      line: "Seymour! The house is on fire!",
      continue: () => {
        ui.openDialogue({
          speaker: "Skinner",
          line: "No, mother, it's just the Northern Lights.",
          continue: () => {
            ui.openDialogue({
              speaker: "Chalmers",
              line: oddFellow,
              continue: () => {
                revealHouseFire();
                if (refs.firetruck) refs.firetruck.visible = true;
                setStage("done");
                ui.closeDialogue();
                ui.showEnd(
                  "Unforgettable!",
                  "Chalmers tip-toes away, still calling them steamed hams. Somewhere behind him, a firetruck begins to wail.",
                );
              },
            });
          },
        });
      },
    });
  }

  function fail(reason) {
    revealHouseFire();
    if (refs.firetruck) refs.firetruck.visible = true;
    setStage("done");
    ui.closeDialogue();
    ui.showEnd("Egads!", reason + " The luncheon is ruined.");
  }

  setStage("await_doorbell");

  return {
    state,
    canInteract,
    labelFor,
    interact,
    setStage,
  };
}
