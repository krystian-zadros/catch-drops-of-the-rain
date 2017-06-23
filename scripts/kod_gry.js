/**
 * Autor: Krystian Zadros
 * Utworzono: 2015-01-17
*/

var canvas = document.getElementById("rysunek");
var con = canvas.getContext("2d");
var width = 360;
var height = 640;
/**
 * Zmienna przetrzymująca referencję do jednego z widoków. Jest używana przez główne
 * funkcje sterujące programu (uruchom() i "graj()) oraz funkcje odpowiedzialne za wybór widoku
 * (ustawWidok(stary), zmienWidok(stary,nowy)). Najczęściej wywołuje ona ich metody inicjuj(), rysuj(), aktualizuj(),
 * które muszą być zawsze w każdym widoku, tak jak metoda sterowanie().
 * @type {null}
 */
var Widok = null;
var zmiennaAnimacji = null;
//var timeout = null;
var wykonuj = true;
/**
 * poziomTrudnosci ma zbiór wartości [0,17], jest to ustawiane ręcznie w widoku
 * WidokUstawPoziomTrudnosci, gdzie jest tez cała obsługa modyfikacji poziomu trudności.
 *
 * poziomTrudnosciMinimum jest używany w widoku WidokUstawPoziomTrudnosci. Służy do korekcji
 * poziomTrudności, aby nie był równy 0, mimo że użytkownik tak to zobaczy.
 * @type {number}
 */
var poziomTrudnosci = 7;
var poziomTrudnosciMinimum = 3;
//window.addEventListener('keydown', this.klawisz2, false);
//window.addEventListener('keydown', this.WidokGra.sterowanie, false);
//window.removeEventListener("keydown", this.klawisz2);

// ================================================
// ======  WIDOKI  ================================
// ================================================
var punkty = 0;
var poziomWody = 0;
var i=0;

/**
 * Funkcja nieuzywana. Pochodzi ze starej wersji skryptu, gdzie był mechanizm
 * start/stop sterujący przebiegiem całej animacji.
 * W tej wersji zostało to zastąpione przez wstzrymywanie wykonywania aktualizacji
 * i rysowania przez ustawienie zmiennej "wykonuj" na false. To podejście jest
 * łatwiejsze w mofyfikacji.
 * Aby włączyć ponownie gre, należy wcisnąć ponownie przycisk stopu, czyli "P".
 */
/*function stop() {
    if (wykonuj == true) {
        window.cancelAnimationFrame(zmiennaAnimacji);
        //window.cancelRequestAnimationFrame(graj);
        //wykonuj = false;
        //document.getElementById("div_informacja").innerHTML = "Wciśnięto STOP.";
        window.clearInterval(timeout);
        timeout = null;
    }
}*/

/**
 * Funkcja już nieużywana.
 * Wypisuje na ekranie w odpowiednio do tego przeznaczonym bloku (albo czym innym
 * o wskazanym identyfikatorze) liczbę punktów.
 */
function wypiszPunty() {
    //document.getElementById("div_wynik").innerHTML = punkty;
}


/**
 * Losuje położenie w poziomie. Stosowana przez WidokGra.tegesy i WidokGra.cegla.
 * @returns {number}
 */
function losujPolozenieX() {
    return Math.floor(Math.random()*width);
}
/**
 * Losuje położenie w pionie. Stosowana przez WidokGra.tegesy i WidokGra.cegla.
 * @returns {number}
 */
function losujPolozenieY() {
    return -Math.floor(Math.random()*height);
}

/**
 * Program ma strukturę złożoną z obiektów reprezentujących widoki, czyli stany w jakich
 * może znajdować się gra. Każdy widok musi mieć metody:
 * 1) rysuj() - wyświetlanie na canvasie,
 * 2) aktualizuj() - modyfikacje stanu wewnętrznego obiektu, czyli jego pól,
 * jakieś "if"-y itd.,
 * 3)inicjuj() - przyporządkowanie polom obiektu wartości domyślnych.
 * 4) sterowanie(e) - obsługa zdarzeń wciskania przycisków z klawiatury. Domyślnie jest
 * wybierane zdarzenie z widoku obsługującego menu.
 *
 * Za ustawianie widoku i zmienianie widoku są odpowiedzialne 2 funkcje:
 * 1) ustawWidok(nowy) - ustawia jeden widok, wywoływana tylko raz na samym początku pracy skryptu,
 * Nie rozbiłem jej na luźne polecenia, żeby łatwo było ją znaleźć i ew. zmodyfikować w przypadku zmian.
 * 2) zmienWidok(stary,nowy) - ustawia widok na nowy, usuwa obsługę zdarzeń klawiatury
 * ze starego i ustawia na metodę "sterowanie" nowego.
 *
 */

/**
 * Obiekt sterowany z klawiatury przez użytkownika.
 * Powinien być elementem składowym w WidokGra, jednak stał się samodzielnym obiektem.
 *
 * "im" to obrazek png o wymiarach 200x1000, zawiarający 20 kadrów o wymiarach 100x100.
 * im_x i im_y służą do wskazywania metodzie drawImage, która część obrazka ma być wyświetlona.
 * this.width i this.height są do pokazania metodzie drawImage jak duży obrazek ma być wyświetlony.
 * Rozmiar część obrazka do wyświetlenia jest podany na sztywno w wywołaniu tej metody.
 * @type {{x: number, y: number, height: number, width: number, im_x: number, im_y: number, im: Image, inicjuj: Function, rysuj: Function}}
 */
var gracz = {
    x: Math.floor(width*0.1)
    , y: Math.floor((height-100)*0.97)
    , height: 100
    , width: 100
    , im_x: 0
    , im_y: 100
    , im: new Image()
    , inicjuj: function() {
        this.x = Math.floor(width*0.1);
        this.y = Math.floor((height-100)*0.97);
        this.im.src = "images/hero_sprite.png";
        this.width = Math.floor(width*0.2);
        this.height = this.width;
        this.y = Math.floor((height-100)*0.97);
    }
    , rysuj: function() {
        con.drawImage(this.im, this.im_x, this.im_y, 100, 100, this.x, this.y, this.width, this.height);
    }
    , aktualizuj: function() {

    }
};
gracz.inicjuj();

/**
 * Widok obsługujący grę.
 * Zawiera w sobie obiekty "tegest" które należy łapać i "cegla", które należy unikać.
 * Oba zawiarają swoje metody "aktualizuj" i "rysuj", które są używane przez swoje odpowiedniki
 * w tym obiekcie (tj. WidokGra).
 * @type {{koniecGry: boolean, tegesy: {lista: Array, nowyTeges: Function, aktualizuj: Function, rysuj: Function, utworzGrupe: Function}, cegla: {lista: Array, utworzNowaSztuke: Function, aktualizuj: Function, rysuj: Function, utworzGrupe: Function}, inicjuj: Function, sprawdzenieZlapaniaTegesow: Function, sprawdzenieZlapaniaCegly: Function, sprawdzenieCzyKoniecGry: Function, aktualizuj: Function, rysujPodloze: Function, rysujIloscPuktow: Function, rysuj: Function, sterowanie: Function}}
 */
var WidokGra = {
    //gracz: graczObj,
    koniecGry: false
    , tegesy: {
        lista: []
        , nowyTeges: function() {
            return {
                x: losujPolozenieX(), //Math.floor(Math.random()*width),
                y: losujPolozenieY() //-Math.floor(Math.random()*30)
            }
        }
        , aktualizuj: function() {
            for (i=0 ; i<this.lista.length ; i++) {
                if ((this.lista[i].y += 2) > height) {
                    this.lista[i].x = losujPolozenieX(); // Math.floor(Math.random()*width);
                    this.lista[i].y = losujPolozenieY(); // -Math.floor(Math.random()*30);
                    poziomWody += 0.2;
                    gracz.y -= Math.floor(poziomWody);
                }
            }
        }
        , rysuj: function() {
            con.fillStyle = "#0aa0ff";
            for (i=0 ; i<this.lista.length ; i++) {
                con.fillRect(this.lista[i].x, this.lista[i].y, 10, 10);
            }
            con.stroke();
        }
        , utworzGrupe: function(argument) {
            this.lista = [];
            for (i=0 ; i<argument ; i++) {
                this.lista[i] = this.nowyTeges();
            }
        }
    }
    , cegla: {
        lista: []
        , utworzNowaSztuke: function() {
            return {
                x: losujPolozenieX(), //Math.floor(Math.random()*width),
                y: losujPolozenieY(), //-Math.floor(Math.random()*30)
                width: Math.floor(width*0.05),
                height: Math.floor(width*0.03)
            }
        }
        , aktualizuj: function () {
            for (i=0 ; i<this.lista.length ; i++) {
                if ((this.lista[i].y += 3) > height) {
                    this.lista[i].x = losujPolozenieX(); // Math.floor(Math.random()*width);
                    this.lista[i].y = losujPolozenieY(); // -Math.floor(Math.random()*30);
                    //poziomWody += 0.3;
                    //gracz.y -= Math.floor(poziomWody);
                }
            }
        }
        , rysuj: function() {
            con.fillStyle = "#aa0000";
            for (i=0 ; i<this.lista.length ; i++) {
                con.fillRect(this.lista[i].x, this.lista[i].y, this.lista[i].width, this.lista[i].height);
            }
            con.stroke();
        }
        , utworzGrupe: function(argument) {
            this.lista = [];
            for (i = 0; i < argument; i++) {
                this.lista[i] = this.utworzNowaSztuke();
            }
        }
    }
    , inicjuj: function() {
        gracz.inicjuj();
        koniecGry = false;
        punkty = 0;
        poziomWody = 0.0;
        this.tegesy.utworzGrupe(15);
        this.cegla.utworzGrupe(poziomTrudnosci + poziomTrudnosciMinimum); //poziomTrudnosci);
    }
    , sprawdzenieZlapaniaTegesow: function() {
        for (i=0 ; i<this.tegesy.lista.length ; i++) {
            if (
                (this.tegesy.lista[i].x >= gracz.x) &&
                (this.tegesy.lista[i].x <= (gracz.x + gracz.width)) &&
                (this.tegesy.lista[i].y >= gracz.y) &&
                (this.tegesy.lista[i].y <= (gracz.y + gracz.height))
            ) {
                ++punkty;
                this.tegesy.lista[i].x = losujPolozenieX();
                this.tegesy.lista[i].y = losujPolozenieY();
                wypiszPunty();
            }
        }
    }
    , sprawdzenieZlapaniaCegly: function() {
        for (i=0 ; i<this.cegla.lista.length ; i++) {
            if (
                (this.cegla.lista[i].x >= gracz.x) &&
                (this.cegla.lista[i].x <= (gracz.x + gracz.width)) &&
                (this.cegla.lista[i].y >= gracz.y) &&
                (this.cegla.lista[i].y <= (gracz.y + gracz.height))
            ) {
                --punkty;
                poziomWody += 0.2;
                this.cegla.lista[i].x = losujPolozenieX();
                this.cegla.lista[i].y = losujPolozenieY();
                wypiszPunty();
            }
        }
    }
    , sprawdzenieCzyKoniecGry: function() {
        if (gracz.y <= 0) {
            //stop();
            //ustawWidok(WidokMenu);
            //window.removeEventListener("keydown", this.WidokGra.sterowanie, false);
            //window.addEventListener("keydown", this.WidokMenu.sterowanie, false);

            //this.koniecGry = true;
            ustawWidok(WidokKoniecGry);
            window.removeEventListener("keydown", WidokGra.sterowanie, false);
            window.addEventListener("keydown", WidokKoniecGry.sterowanie, false);
            //document.getElementById("div_informacja").innerHTML = "Koniec gry.";
        }
    }
    , aktualizuj: function() {
        this.tegesy.aktualizuj();
        this.cegla.aktualizuj();
        this.sprawdzenieZlapaniaTegesow();
        this.sprawdzenieZlapaniaCegly();
        this.sprawdzenieCzyKoniecGry();
    }
    , rysujPodloze: function() {
        con.fillStyle = "#0000dd";
        con.fillRect(0, gracz.y + gracz.height, width, height);
        con.stroke();
    }
    , rysujIloscPuktow: function() {
        con.fillStyle = "#7a7d80";
        con.fillRect(Math.floor(width*0.015),Math.floor(height*0.909), Math.floor(width*0.48), Math.floor(height*0.08));
        con.stroke();

        // Wypisanie liczby punktów
        con.font = (width*0.06) + "pt Arial";
        con.fillStyle = "yellow";
        con.fillText(punkty + "", Math.floor(width*0.03), Math.floor(height*0.955));
        con.font = (width*0.028) + "pt Arial";
        con.fillText("PUNKTÓW", Math.floor(width*0.03), Math.floor(height*0.98));

        // Wypisanie poziomu trudności
        con.font = (width*0.06) + "pt Arial";
        con.fillStyle = "yellow";
        con.fillText(poziomTrudnosci + "", Math.floor(width*0.27), Math.floor(height*0.955));
        con.font = (width*0.028) + "pt Arial";
        con.fillText("TRUDNOŚĆ", Math.floor(width*0.27), Math.floor(height*0.98));
    }
    , rysuj: function() {
        con.fillStyle = "#000a0b";
        con.fillRect(0,0, width, height);
        con.stroke();
        gracz.rysuj();
        this.rysujPodloze();
        this.tegesy.rysuj();
        this.cegla.rysuj();
        this.rysujIloscPuktow();

        /*if (this.koniecGry == true) {
            con.font = (width*0.14) + "pt Arial";
            con.fillStyle = "red";
            con.fillText("Koniec gry", Math.floor(width*0.05), Math.floor(height*0.4));
        }*/
    }
    , sterowanie: function(e) {
        var code = e.keyCode;
        /**
         * Pauza, takie coś jest w kazdym widoku. Celowo poza switchem, żeby
         * podczas przerwy w grze nie dało się np. przesunąć postaci lub namącić ze zmiana
         * widoku.
         */
        if (code == 80) {
            wykonuj = !wykonuj;
        }
        else if (wykonuj == true)
        switch (code) {
            case 37:
                // left key
                //Widok = WidokWyswietlNajlepszeWyniki;
                if (gracz.x > 1) gracz.x -= 5;
                gracz.im_x = (gracz.im_x + 100) % 1000;
                if (gracz.im_y>0) gracz.im_y = 0;
                //document.getElementById("diw").innerHTML = "Zaznaczony";
                //document.getElementById("diw2").innerHTML = "Sterowanie GRA: " + code;
                break;
            case 39:
                // right key
                if (gracz.x < (width - gracz.width)) gracz.x += 5;
                gracz.im_x = (gracz.im_x + 100) % 1000;
                if (gracz.im_y==0) gracz.im_y = 100;
                //document.getElementById("diw").innerHTML = "Zaznaczony";
                //document.getElementById("diw2").innerHTML = "Sterowanie GRA: " + code;
                break;
            case 27: // Escape
                /*ustawWidok(WidokMenu);
                window.removeEventListener("keydown", this.WidokGra.sterowanie, false);
                window.addEventListener("keydown", this.WidokMenu.sterowanie, false);*/
                zmienWidok(WidokGra, WidokMenu);
                break;
            default:
                //document.getElementById("diw2").innerHTML = "Sterowanie GRA: " + code;
                break;
        }
    }
};

/**
 * Widok obsługujący menu.
 * Sterowanie strzałkami do góry i w dół.
 * Po najechaniu na odpowiedni element menu, należy wcisnąć enter, aby przełączyć widok.
 * Aby zmodyfikować listę menu, należy dodać nowy lub usunąć jakiś element z pola "elementy",
 * składającego się z par {opis, referencja do funkcji}
 * Metoda "ustawWidokZMenu" jest już nieużywana, bo została zastąpioona przez funkcje globalną
 * zmienWidok(stary, nowy), która zmienia widok razem ze sterowaniem dla każdego przypadku w skrypcie.
 * Ponieważ użycie pola "funkcja" z pola "elementy" było kłopotliwe, aby dodać/usunąć element
 * w menu, należy tez zmodyfikować w metodzie "sterowanie" przypadek wciśnięcia Enter, czyli "case 13".
 *
 * "sterowanie" - metoda ustawiana przez funkcję zmienWidok(a,b) jako funkcja obsługi zdarzeń
 * wciśnięcia przycisku na klawiatyurze.
 *
 * @type {{zaznaczonyElement: number, elementy: {opis: string, funkcja: Function}[], aktualizuj: Function, ustawWidokZMenu: Function, rysuj: Function, inicjuj: Function, sterowanie: Function}}
 */
var WidokMenu = {
    zaznaczonyElement: 0
    , elementy: [
        {opis: "Nowa Gra",
            funkcja: function() {this.ustawWidokZMenu(WidokGra);}}
        /*, {opis: "Najlepsze wyniki",
            funkcja: function() {this.ustawWidokZMenu(WidokWyswietlNajlepszeWyniki);}}*/
        , {opis: "Poziom trudnosci",
            funkcja: function() {this.ustawWidokZMenu(WidokUstawPoziomTrudnosci);}}
        , {opis: "Informacje",
            funkcja: function() {this.ustawWidokZMenu(WidokInformacjeOGrze);}}
    ]
    , aktualizuj: function() {

    }
    , ustawWidokZMenu: function(nowy) {
        ustawWidok(nowy);
        //window.removeEventListener("keydown", this.WidokMenu.sterowanie, false);
        //window.addEventListener("keydown", this.WidokGra.sterowanie, false);
    }
    , rysuj: function() {
        //con.fillStyle = "#bb00ff";
        con.fillStyle = "#9f9fdf";
        con.fillRect(0,0, width, height);
        con.stroke();

        // Zakolorowanie zaznaczonego elementu
        //con.fillStyle = "#aa0000";
        con.fillStyle = "#ffff00";
        con.fillRect(0, this.zaznaczonyElement*30 + 10, width, 30);
        con.stroke();

        con.font = "20pt Arial";
        //con.fillStyle = "blue";
        con.fillStyle = "#082567";
        for (i=0 ; i<this.elementy.length ; i++) {
            con.fillText(this.elementy[i].opis, 10, 30*(i+1));
        }

    }
    , inicjuj: function() {
    }
    , sterowanie: function(e) {
        var code = e.keyCode;
        if (code == 80) {
            wykonuj = !wykonuj;
        }
        else if (wykonuj == true)
        switch (code) {
            case 38:
                // up key
                if (WidokMenu.zaznaczonyElement>0)
                    WidokMenu.zaznaczonyElement = WidokMenu.zaznaczonyElement - 1; //--(this.zaznaczonyElement);
                //document.getElementById("diw").innerHTML = "Zaznaczony";
                //document.getElementById("diw2").innerHTML = "Sterowanie GRA: " + code;
                break;
            case 40:
                // down key
                if (WidokMenu.zaznaczonyElement < (WidokMenu.elementy.length - 1))
                    WidokMenu.zaznaczonyElement = WidokMenu.zaznaczonyElement + 1;
                //document.getElementById("diw").innerHTML = "Zaznaczony";
                //document.getElementById("diw2").innerHTML = "Sterowanie GRA: " + code;
                break;
            case 13:
                //WidokMenu.elementy[WidokMenu.zaznaczonyElement].funkcja();
                switch (WidokMenu.zaznaczonyElement) {
                    case 0:
                        /*WidokMenu.ustawWidokZMenu(WidokGra);
                        WidokGra.inicjuj();
                        window.removeEventListener("keydown", WidokMenu.sterowanie, false);
                        window.addEventListener("keydown", WidokGra.sterowanie, false);*/
                        zmienWidok(WidokMenu, WidokGra);
                        break;
                    /*case 1:
                        WidokMenu.ustawWidokZMenu(WidokWyswietlNajlepszeWyniki);
                        window.removeEventListener("keydown", WidokMenu.sterowanie, false);
                        window.addEventListener("keydown", WidokWyswietlNajlepszeWyniki.sterowanie, false);*/
                        break;
                    //case 2:
                    case 1:
                        /*WidokMenu.ustawWidokZMenu(WidokUstawPoziomTrudnosci);
                        window.removeEventListener("keydown", WidokMenu.sterowanie, false);
                        window.addEventListener("keydown", WidokUstawPoziomTrudnosci.sterowanie, false);*/
                        zmienWidok(WidokMenu, WidokUstawPoziomTrudnosci);
                        break;
                    case 2:
                        zmienWidok(WidokMenu, WidokInformacjeOGrze);
                        break;
                    default:
                        break;
                }
                //Widok = WidokGra;
                break;
            case 27: // Escape
                /*ustawWidok(WidokGra);
                WidokGra.inicjuj();
                window.removeEventListener("keydown", this.WidokMenu.sterowanie, false);
                window.addEventListener("keydown", this.WidokGra.sterowanie, false);*/
                zmienWidok(WidokMenu, WidokGra);
                break;
            default:
                //document.getElementById("diw2").innerHTML = "Sterowanie GRA: " + code;
                break;
        }
    }
};
/**
 * Ten widok jest nieużywany i teraz nic nie robi. Miał korzystać z localstorage do
 * zapisywania 5 najlepszych wyników.
 * @type {{aktualizuj: Function, rysuj: Function, inicjuj: Function, sterowanie: Function}}
 */
var WidokWyswietlNajlepszeWyniki = {
    aktualizuj: function() {

    }
    , rysuj: function() {
        con.fillStyle = "#9f9fdf";  // Fajny fioletowy :o
        con.fillRect(0,0, width, height);
        con.stroke();
    }
    , inicjuj: function() {

    }
    , sterowanie: function(e) {
        var code = e.keyCode;
        if (code == 80) {
            wykonuj = !wykonuj;
        }
        else if (wykonuj == true)
        switch (code) {
            case 13: /** Enter i Esc pozwalaja na wyjscie z widoku. */
            case 27:
                /*ustawWidok(WidokMenu);
                window.removeEventListener("keydown", WidokWyswietlNajlepszeWyniki.sterowanie, false);
                window.addEventListener("keydown", WidokMenu.sterowanie, false);*/
                zmienWidok(WidokWyswietlNajlepszeWyniki, WidokMenu);
                break;
            default:
                break;
        }
    }
};

var WidokInformacjeOGrze = {
    tresc: [
        "Łapacz kropel"
        , "Zbieraj spadające krople wody"
        , "i omijaj cegły. Za każdą cegłę"
        , "tracisz punkt. Poziom wody"
        , "podnosi się, gdy nie złapiesz"
        , "jakiejś kropli, lub złapiesz cegłę."
        , "Wciśnij Escape, aby przejść do"
        , "Menu."
        , "Sterowanie w grze strzałkami."
        , "W Menu możesz wybrać poziom"
        , "trudności."
    ]
    , aktualizuj: function() {

    }
    , rysuj: function() {
        con.fillStyle = "#9f9fdf";  // Fajny fioletowy :o
        con.fillRect(0,0, width, height);
        con.stroke();

        con.font = (width*0.05) + "pt Arial";
        con.fillStyle = "#082567";
        for (i=0 ; i<this.tresc.length ; i++)
            con.fillText( this.tresc[i], Math.floor(width*0.02), Math.floor((i+1)*height/(this.tresc.length+1)));
        //con.fillText( "Wciśnij Escape, aby ", Math.floor(width*0.05), Math.floor(height*0.6));
    }
    , inicjuj: function() {

    }
    , sterowanie: function(e) {
        var code = e.keyCode;
        if (code == 80) {
            wykonuj = !wykonuj;
        }
        else if (wykonuj == true)
            switch (code) {
                case 13: /** Enter i Esc pozwalaja na wyjscie z widoku. */
                case 27:
                    /*ustawWidok(WidokMenu);
                     window.removeEventListener("keydown", WidokWyswietlNajlepszeWyniki.sterowanie, false);
                     window.addEventListener("keydown", WidokMenu.sterowanie, false);*/
                    zmienWidok(WidokInformacjeOGrze, WidokMenu);
                    break;
                default:
                    break;
            }
    }
};

/** Poziom trudnosci regulowany od 0 do 5, gdzie 0 to najniższy poziom trudności.
 * Ma być ustawiany tak, aby użytkownik widział zakres od 0 do 5, ale w zmiennej
 * żeby była zapisana ta wartość +3, np. użytkownik wybierze poziom "2", a zmienna
 * poziomTrudnosci = wybranyPoziom + 3 = 2+3 = 5;.
 * Zmienna poziomTrudnosci jest używana do tworzenia zbioru cegieł, zależnego od poziomu trudności.
 * Dla tego przykładu zbiór cegieł będzie miał 5 elementów, a użytkownik będzie wiedział,
 * że ra na poziomie trudności stopnia 2.
 *
  * @type {{aktualizuj: Function, rysuj: Function, inicjuj: Function, sterowanie: Function}}
 */
var WidokUstawPoziomTrudnosci = {
    wys: Math.floor(height*0.04)
    , polozenie: Math.floor(height*0.05)
    , szer: Math.floor(width*0.8)
    , aktualizuj: function() {

    }
    , rysuj: function() {
        //con.fillStyle = "#000ff0";
        con.fillStyle = "#9f9fdf";
        con.fillRect(0,0, width, height);
        con.stroke();

        con.fillStyle = "#000000";
        for (i=17 ; i>=0 ; i--) {
            con.fillRect( Math.floor(width*0.1) , (i+1) * this.polozenie , //i * this.wys,
                this.szer , this.wys);
            //this.polozenie += this.odstep;
        }
        con.stroke();

        //con.fillStyle = "#0dca00";
        con.fillStyle = "#ffff1c";
        for (i=17 ; i>=(17 - poziomTrudnosci) ; i--) {
            con.fillRect( Math.floor(width*0.1) , (i+1) * this.polozenie , //i * this.wys,
                this.szer , this.wys);
            //this.polozenie += this.odstep;
        }
        con.stroke();
    }
    , inicjuj: function() {

    }
    , sterowanie: function(e) {
        var code = e.keyCode;
        if (code == 80) {
            wykonuj = !wykonuj;
        }
        else if (wykonuj == true)
        switch (code) {
            case 38:
                poziomTrudnosci = (poziomTrudnosci + 1) % 18;
                break;
            case 40:
                poziomTrudnosci = (poziomTrudnosci == 0) ? (poziomTrudnosci = 17) : (poziomTrudnosci - 1);
                break;
            case 13:
            case 27:
                /*ustawWidok(WidokMenu);
                window.removeEventListener("keydown", WidokUstawPoziomTrudnosci.sterowanie, false);
                window.addEventListener("keydown", WidokMenu.sterowanie, false);*/
                zmienWidok(WidokUstawPoziomTrudnosci, WidokMenu);
                break;
            default:
                break;
        }
    }
};

var WidokKoniecGry = {
    informacjaOPunktach: ""
    , aktualizuj: function() {

    }
    , rysuj: function() {
        // tło
        //con.fillStyle = "#4169E1";
        con.fillStyle = "#9f9fdf";
        con.fillRect(0,0,width,height);
        con.stroke();

        con.font = (width*0.143) + "pt Arial";
        con.fillStyle = "#800000";
        con.fillText("Koniec gry", Math.floor(width*0.05), Math.floor(height*0.4));

        // Wypisanie liczby punktów lekko poniżej środka ekranu.
        con.font = (width*0.07) + "pt Arial";
        con.fillStyle = "#082567";
        con.fillText( this.informacjaOPunktach, Math.floor(width*0.05), Math.floor(height*0.6));
    }
    , inicjuj: function() {
        //var t = (Math.abs(punkty) % 10);
        //this.informacjaOPunktach = ("Zdobyłeś: " + punkty + ((punkty==1) ? " punkt" : ((2<=punkty<=3) ? " punkty" : " punktow")));
        this.informacjaOPunktach = "Zdobyłeś " + punkty;
        if (punkty == 1)
            this.informacjaOPunktach += " punkt";
        else if (((Math.abs(punkty) % 10)>=2 && (Math.abs(punkty) % 10)<=4))
            this.informacjaOPunktach += " punkty";
        else this.informacjaOPunktach += " punktów";
    }
    , sterowanie: function(e) {
        var code = e.keyCode;
        if (code == 80) {
            wykonuj = !wykonuj;
        }
        else if (wykonuj == true)
            switch (code) {
                case 13: /** Enter i Esc pozwalaja na wyjscie z widoku. */
                case 27:
                    //ustawWidok(WidokMenu);
                    //window.removeEventListener("keydown", WidokKoniecGry.sterowanie, false);
                    //window.addEventListener("keydown", WidokMenu.sterowanie, false);
                    zmienWidok(WidokKoniecGry, WidokMenu);
                    break;
                default:
                    break;
            }
    }
}

/**
 * Zmienna requestAnimationFrame przetrzymuje metody do sterowania animacją
 * na różnych przeglądarkach.
 * @type {Function}
 */
var requestAnimationFrame = window.requestAnimationFrame ||
    window.mozRequestAnimationFrame ||
    window.webkitRequestAnimationFrame ||
    window.msRequestAnimationFrame;


//Widok = WidokMenu;
//Widok = WidokGra;
//WidokGra.gracz.inicjuj();
//Widok = WidokWyswietlNajlepszeWyniki;
function ustawWidok(nowy) {
    Widok = nowy;
    Widok.inicjuj();
    /*if (nowy == WidokGra)
        WidokGra.gracz.inicjuj();*/
}

function zmienWidok(stary, nowy) {
    Widok = nowy;
    Widok.inicjuj();
    window.removeEventListener("keydown", stary.sterowanie, false);
    window.addEventListener("keydown", nowy.sterowanie, false);
    /*if (nowy == WidokGra)
     WidokGra.gracz.inicjuj();*/
}

ustawWidok(WidokMenu);
window.addEventListener("keydown", this.WidokMenu.sterowanie, false);
uruchom();

function uruchom() {
    WidokGra.tegesy.utworzGrupe(15);
    graj();
}

/*var x = 100;
var y = 100;*/

function graj() {
    if (wykonuj == true) {
        Widok.aktualizuj();
        Widok.rysuj();
    }

    /*// Dodatkowy przesuwajacy sie zielony element na ekranie.
    con.fillStyle = "#00ff00";
    con.fillRect(x,y, 50, 30);
    x = (x + 5) % width;
    con.stroke();*/

    zmiennaAnimacji = requestAnimationFrame(graj);
}
