package backend

import (
	"encoding/json"
	"fmt"
	"io/ioutil"
	"log"
	"net/http"
	"time"
)

type sendEventInput struct {
	Type string `json:"type"`
}

func (s *APIServer) sendEvent(w http.ResponseWriter, r *http.Request) {
	bodyBytes, e := ioutil.ReadAll(r.Body)
	if e != nil {
		s.writeErrorJson(w, fmt.Sprintf("error reading request input: %s", e))
		return
	}
	log.Printf("requestJson: %s\n", string(bodyBytes))

	var input sendEventInput
	e = json.Unmarshal(bodyBytes, &input)
	if e != nil {
		s.writeErrorJson(w, fmt.Sprintf("error unmarshaling json: %s; bodyString = %s", e, string(bodyBytes)))
		return
	}

	if input.Type == "page_view" {
		e = s.metricsTracker.SendUpdateEvent(time.Now(), true)
		if e != nil {
			log.Printf("error sending page view event: %s\n", e)
		}
	} else {
		log.Printf("unknown event type: %s\n", input.Type)
	}

	s.writeJson(w, map[string]bool{"success": true})
}
