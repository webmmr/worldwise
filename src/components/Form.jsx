// "https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=0&longitude=0"

import { useEffect, useState } from "react";
import { useGeoPosition } from "../hooks/useGeoPosition";
import { useCities } from "../contexts/CitiesContext";
import { useNavigate } from "react-router-dom";

import DatePicker from "react-datepicker";

import "react-datepicker/dist/react-datepicker.css";

import Message from "./Message";
import Spinner from "./Spinner";
import styles from "./Form.module.css";
import Button from "./Button";
import BackBtn from "./BackBtn";

export function convertToEmoji(countryCode) {
  const codePoints = countryCode
    .toUpperCase()
    .split("")
    .map((char) => 127397 + char.charCodeAt());
  return String.fromCodePoint(...codePoints);
}

const BASE_URL = "https://api.bigdatacloud.net/data/reverse-geocode-client";

function Form() {
  const [lat, lng] = useGeoPosition();
  const { createCity, isLoading } = useCities();

  const navigate = useNavigate();

  const [isGeoPositionLoading, setIsGeoPositionLoading] = useState(false);
  const [cityName, setCityName] = useState("");
  const [country, setCountry] = useState("");
  const [emoji, setEmoji] = useState("");
  const [date, setDate] = useState(new Date());
  const [notes, setNotes] = useState("");
  const [geoPositionError, setGeoPositionError] = useState("");

  async function handleSubmit(e) {
    e.preventDefault();

    if (!cityName || !date) return;

    const newCity = {
      cityName,
      country,
      emoji,
      notes,
      date,
      position: { lat, lng },
    };

    await createCity(newCity);
    navigate("/app/cities");
  }

  useEffect(() => {
    async function getPositionData() {
      if (!lat && !lng) return;
      try {
        setIsGeoPositionLoading(false);
        setGeoPositionError("");
        const res = await fetch(`${BASE_URL}?latitude=${lat}&longitude=${lng}`);

        const data = await res.json();

        if (!data.city)
          throw new Error(
            "There is no country in the selected area. Please select somewhere else"
          );

        setCityName(data.city || data.localy || "");
        setCountry(data.country);
        setEmoji(convertToEmoji(data.countryCode));
      } catch (err) {
        setGeoPositionError(err.message);
      } finally {
        setIsGeoPositionLoading(false);
      }
    }
    getPositionData();
  }, [lat, lng]);

  if (geoPositionError) return <Message message={geoPositionError} />;

  if (!lat && !lng)
    return <Message message="Start clicking somewhere on the map" />;

  if (isGeoPositionLoading) return <Spinner />;

  return (
    <form
      className={`${styles.form} ${isLoading ? styles.loading : ""}`}
      onSubmit={(e) => handleSubmit(e)}
    >
      <div className={styles.row}>
        <label htmlFor="cityName">City name</label>
        <input
          id="cityName"
          onChange={(e) => setCityName(e.target.value)}
          value={cityName}
        />
        <span className={styles.flag}>{emoji}</span>
      </div>

      <div className={styles.row}>
        <label htmlFor="date">When did you go to {cityName}?</label>
        {/* <input
          id="date"
          onChange={(e) => setDate(e.target.value)}
          value={date}
        /> */}
        <DatePicker selected={date} onChange={(date) => setDate(date)} />
      </div>

      <div className={styles.row}>
        <label htmlFor="notes">Notes about your trip to {cityName}</label>
        <textarea
          id="notes"
          onChange={(e) => setNotes(e.target.value)}
          value={notes}
        />
      </div>

      <div className={styles.buttons}>
        <Button type="primary">Add</Button>
        <BackBtn type="back">&larr; Back</BackBtn>
      </div>
    </form>
  );
}

export default Form;
