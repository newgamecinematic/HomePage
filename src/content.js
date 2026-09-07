window.ATLAS_DATA = {
  defaultWorld: "fractured-realm",
  worlds: {
    "fractured-realm": {
      name: "The Fractured Realm",
      kicker: "WORLD 01 · THE FALLEN LIGHT",
      archiveDescription: "하늘에서 떨어진 빛이 세 대지를 갈라놓고 서로 다른 문명을 깨운 세계.",
      titleLine: "THE FRACTURED",
      titleEmphasis: "REALM.",
      description: "세 개의 대지, 서로 다른 빛의 기억.",
      era: "746",
      accent: "#d59c59",
      model: "./assets/demo-world.glb",
      poster: "./assets/world-map.png",
      regions: ["grove", "citadel", "ashen"]
    }
  },
  regions: {
    grove: {
      name: "Aether Grove", chapter: "Chapter I", type: "Northern Sanctuary", accent: "#74b9b2",
      description: "별의 파편을 품은 거목 아래 세워진 북부의 성역. 숲은 방문자의 기억을 읽고 길을 바꾸며, 수호자들은 가장 오래된 빛의 언어를 지킨다.",
      faction: "The Verdant Choir", firstRecord: "Year 003", model: "./assets/region-grove.glb",
      position: "0 3.4 -2.1", view: { target: "0m 2m -2.1m", orbit: "15deg 45deg 9m" },
      characters: [{ id:"oracle", name:"Moss Oracle", role:"Seer · Verdant Choir", description:"거목의 기억을 목소리로 번역하는 마지막 예언자. 뿌리와 연결된 가면을 통해 숲의 과거를 본다.", firstRecord:"Year 681", model:null }]
    },
    citadel: {
      name: "Sunforge Citadel", chapter: "Chapter II", type: "Western Dominion", accent: "#d59c59",
      description: "추락한 별의 열을 동력으로 사용하는 서부의 성채. 황금 의회는 빛이 신의 유산이라 주장하지만, 도시 아래의 용광로는 서서히 식어가고 있다.",
      faction: "The Gilded Council", firstRecord: "Year 089", model: "./assets/region-citadel.glb",
      position: "-4 2.8 1.1", view: { target: "-4m 1.6m 1.1m", orbit: "-25deg 48deg 8m" },
      characters: [{ id:"regent", name:"Solar Regent", role:"Ruler · Gilded Council", description:"태양의 왕관을 이어받은 젊은 통치자. 꺼져가는 용광로의 비밀을 숨긴 채 마지막 원정을 준비한다.", firstRecord:"Year 728", model:null }]
    },
    ashen: {
      name: "The Ashen Reach", chapter: "Chapter III", type: "Eastern Reach", accent: "#d66554",
      description: "검은 산맥과 용암의 강으로 둘러싸인 동부의 재의 왕국. 오래전 멸망했지만 성벽과 수호자들은 아직 마지막 명령을 반복한다.",
      faction: "The Order of Cinders", firstRecord: "Year 117", model: "./assets/region-ashen.glb",
      position: "4.1 3.6 1.15", view: { target: "4.1m 1.8m 1.15m", orbit: "28deg 48deg 8m" },
      characters: [{ id:"warden", name:"Ash Warden", role:"Guardian · Order of Cinders", description:"재의 왕국 마지막 관문을 지키는 무명의 수호자. 갑주 안에는 인간의 육체가 아니라 꺼지지 않는 불씨와 오래된 맹세만 남아 있다.", firstRecord:"Year 712", model:null }]
    }
  }
};
